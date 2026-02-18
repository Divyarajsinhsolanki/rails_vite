class Api::ConversationsController < Api::BaseController
  before_action :set_conversation, only: [:show]

  def index
    conversations = Conversation.for_user(current_user)
      .includes(:participants, :messages)
      .order(updated_at: :desc)

    render json: conversations.map { |conversation| serialize_conversation(conversation) }
  end

  def show
    participant = @conversation.conversation_participants.find_by(user_id: current_user.id)
    participant&.update(last_read_at: Time.current)

    render json: serialize_conversation(@conversation, include_messages: true)
  end

  def create
    conversation = Conversation.new(conversation_params.merge(creator: current_user))

    participant_ids = Array(params[:participant_ids]).map(&:to_i).uniq
    participant_ids << current_user.id

    if conversation.save
      participant_ids.each do |user_id|
        conversation.conversation_participants.create!(user_id: user_id)
      end
      Chat::Broadcaster.broadcast_conversation_refresh(conversation)
      render json: serialize_conversation(conversation), status: :created
    else
      render json: { errors: conversation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def start_direct
    other_user = User.find(params[:user_id])
    conversation = find_or_create_direct_conversation(other_user)

    render json: serialize_conversation(conversation)
  end

  private

  def set_conversation
    @conversation = Conversation.for_user(current_user).find(params[:id])
  end

  def conversation_params
    params.require(:conversation).permit(:title, :conversation_type)
  end

  def find_or_create_direct_conversation(other_user)
    candidate = Conversation.conversation_direct
      .joins(:conversation_participants)
      .where(conversation_participants: { user_id: [current_user.id, other_user.id] })
      .group("conversations.id")
      .having("COUNT(DISTINCT conversation_participants.user_id) = 2")
      .first

    return candidate if candidate

    conversation = Conversation.create!(conversation_type: :direct, creator: current_user)
    conversation.conversation_participants.create!(user: current_user)
    conversation.conversation_participants.create!(user: other_user)
    Chat::Broadcaster.broadcast_conversation_refresh(conversation)
    conversation
  end

  def serialize_conversation(conversation, include_messages: false)
    membership = conversation.conversation_participants.find { |cp| cp.user_id == current_user.id } || conversation.conversation_participants.find_by(user_id: current_user.id)
    unread_count = conversation.messages.where("messages.created_at > ?", membership&.last_read_at || Time.at(0)).where.not(user_id: current_user.id).count
    payload = {
      id: conversation.id,
      title: conversation.display_name(current_user),
      conversation_type: conversation.conversation_type,
      participants: conversation.participants.map { |user| { id: user.id, name: user.full_name, profile_picture: (rails_blob_url(user.profile_picture, only_path: true) if user.profile_picture.attached?) } },
      unread_count: unread_count,
      last_message_at: conversation.messages.maximum(:created_at),
      updated_at: conversation.updated_at
    }

    if include_messages
      payload[:messages] = conversation.messages.order(created_at: :asc).map do |message|
        {
          id: message.id,
          body: message.body,
          user_id: message.user_id,
          user_name: message.user.full_name,
          user_profile_picture: message.user.profile_picture.attached? ? rails_blob_url(message.user.profile_picture, only_path: true) : nil,
          created_at: message.created_at,
          attachments: message.attachments.map { |attachment| { id: attachment.id, url: rails_blob_url(attachment, only_path: true), content_type: attachment.content_type, filename: attachment.filename.to_s } }
        }
      end
    end

    last_message = conversation.messages.order(created_at: :desc).first
    payload[:last_message] = last_message&.body.presence || (last_message&.attachments&.attached? ? "Sent an attachment" : nil)
    
    payload  end
end
