module Chat
  class Broadcaster
    class << self
      def broadcast_message_created(message)
        payload = {
          type: "message_created",
          conversation_id: message.conversation_id,
          message: serialize_message(message)
        }

        ActionCable.server.broadcast(conversation_stream(message.conversation_id), payload)
        broadcast_conversation_refresh(message.conversation)
      end

      def broadcast_conversation_refresh(conversation)
        conversation.participant_ids.each do |participant_id|
          ActionCable.server.broadcast(user_stream(participant_id), {
            type: "conversation_refresh",
            conversation_id: conversation.id
          })
        end
      end

      def user_stream(user_id)
        "chat_user_#{user_id}"
      end

      def conversation_stream(conversation_id)
        "chat_conversation_#{conversation_id}"
      end

      private

      def serialize_message(message)
        {
          id: message.id,
          body: message.body,
          user_id: message.user_id,
          user_name: message.user.full_name,
          user_profile_picture: message.user.profile_picture.attached? ? Rails.application.routes.url_helpers.rails_blob_path(message.user.profile_picture, only_path: true) : nil,
          created_at: message.created_at,
          attachments: message.attachments.map do |attachment|
            {
              id: attachment.id,
              url: Rails.application.routes.url_helpers.rails_blob_path(attachment, only_path: true),
              content_type: attachment.content_type,
              filename: attachment.filename.to_s
            }
          end
        }
      end
    end
  end
end
