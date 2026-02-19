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

      def broadcast_message_reactions_updated(message, last_actor_id: nil, last_actor_emoji: nil, last_actor_action: nil)
        payload = {
          type: "message_reactions_updated",
          conversation_id: message.conversation_id,
          message_id: message.id,
          reactions: message.reaction_counts,
          last_actor_id: last_actor_id,
          last_actor_emoji: last_actor_emoji,
          last_actor_action: last_actor_action
        }

        ActionCable.server.broadcast(conversation_stream(message.conversation_id), payload)
      end

      def broadcast_conversation_refresh(conversation)
        conversation.participant_ids.each do |participant_id|
          ActionCable.server.broadcast(user_stream(participant_id), {
            type: "conversation_refresh",
            conversation_id: conversation.id
          })
        end
      end

      def broadcast_typing_indicator(conversation_id, user, is_typing)
        payload = {
          type: "typing_indicator",
          conversation_id: conversation_id,
          user_id: user.id,
          user_name: user.full_name,
          is_typing: is_typing
        }

        ActionCable.server.broadcast(conversation_stream(conversation_id), payload)
      end

      def broadcast_message_read(conversation_id, user_id)
        payload = {
          type: "message_read",
          conversation_id: conversation_id,
          user_id: user_id,
          read_at: Time.current
        }

        ActionCable.server.broadcast(conversation_stream(conversation_id), payload)
      end

      def broadcast_notification(notification)
        payload = {
          type: "notification_received",
          notification: {
            id: notification.id,
            action: notification.action,
            message: notification.metadata[:conversation_name].present? ? "New message in #{notification.metadata[:conversation_name]}" : "You have a new notification",
            actor_avatar: notification.actor.profile_picture.attached? ? Rails.application.routes.url_helpers.rails_blob_path(notification.actor.profile_picture, only_path: true) : nil,
            created_at: notification.created_at
          }
        }

        ActionCable.server.broadcast(user_stream(notification.recipient_id), payload)
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
          end,
          reactions: message.reaction_counts,
          reacted_emojis: []
        }
      end
    end
  end
end
