class ChatChannel < ApplicationCable::Channel
  def subscribed
    if params[:conversation_id].present?
      subscribe_to_conversation(params[:conversation_id])
    else
      stream_from Chat::Broadcaster.user_stream(current_user.id)
    end
  end

  private

  def subscribe_to_conversation(conversation_id)
    conversation = Conversation.for_user(current_user).find_by(id: conversation_id)
    reject unless conversation

    stream_from Chat::Broadcaster.conversation_stream(conversation.id)
  end
end
