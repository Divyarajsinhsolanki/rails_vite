class Message < ApplicationRecord
  IMAGE_TYPES = %w[image/png image/jpeg image/jpg image/gif image/webp].freeze
  VIDEO_TYPES = %w[video/mp4 video/webm video/quicktime].freeze

  belongs_to :conversation
  belongs_to :user
  has_many_attached :attachments

  validate :body_or_attachment_present
  validate :attachment_types

  after_create_commit :broadcast_message
  after_create_commit :notify_participants

  private

  def body_or_attachment_present
    return if body.present? || attachments.attached?

    errors.add(:base, "Message must include text or an attachment")
  end

  def attachment_types
    return unless attachments.attached?

    attachments.each do |attachment|
      next if IMAGE_TYPES.include?(attachment.content_type) || VIDEO_TYPES.include?(attachment.content_type)

      errors.add(:attachments, "must be an image or video")
    end
  end

  def broadcast_message
    Chat::Broadcaster.broadcast_message_created(self)
  end

  def notify_participants
    recipient_ids = conversation.participants.where.not(id: user_id).pluck(:id)

    recipient_ids.each do |recipient_id|
      Notification.create(
        recipient_id: recipient_id,
        actor: user,
        action: "chat_message",
        notifiable: self,
        metadata: {
          conversation_id: conversation_id,
          conversation_name: conversation.display_name(User.find(recipient_id))
        }
      )
    end
  end
end
