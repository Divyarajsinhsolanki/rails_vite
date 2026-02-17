class Api::MessagesController < Api::BaseController
  before_action :set_conversation

  def create
    message = @conversation.messages.new(message_params)
    message.user = current_user

    if message.save
      @conversation.touch
      @conversation.conversation_participants.where(user_id: current_user.id).update_all(last_read_at: Time.current)
      render json: {
        id: message.id,
        body: message.body,
        user_id: message.user_id,
        user_name: message.user.full_name,
        created_at: message.created_at,
        attachments: message.attachments.map { |attachment| { id: attachment.id, url: rails_blob_url(attachment, only_path: true), content_type: attachment.content_type, filename: attachment.filename.to_s } }
      }, status: :created
    else
      render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_conversation
    @conversation = Conversation.for_user(current_user).find(params[:conversation_id])
  end

  def message_params
    params.require(:message).permit(:body, attachments: [])
  end
end
