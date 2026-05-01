class Message < ApplicationRecord
  IMAGE_TYPES = %w[image/png image/jpeg image/jpg image/gif image/webp].freeze
  VIDEO_TYPES = %w[video/mp4 video/webm video/quicktime].freeze
  MENTION_REGEX = /@([a-zA-Z0-9._-]+)/.freeze

  belongs_to :conversation
  belongs_to :user
  has_many_attached :attachments
  has_many :message_reactions, dependent: :destroy

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

  public

  def reaction_counts
    message_reactions.group(:emoji).count
  end

  def reacted_emojis_for(user)
    return [] unless user

    message_reactions.where(user_id: user.id).pluck(:emoji)
  end

  def notify_participants
    recipients = conversation.participants.where.not(id: user_id)
    mentioned_user_ids = extract_mentioned_user_ids(recipients)

    recipients.find_each do |recipient|
      mentioned = mentioned_user_ids.include?(recipient.id)

      Notification.create(
        recipient_id: recipient.id,
        actor: user,
        action: mentioned ? "chat_ping" : "chat_message",
        notifiable: self,
        metadata: {
          conversation_id: conversation_id,
          conversation_name: conversation.display_name(recipient),
          mentioned: mentioned
        }
      )
    end
  end

  def extract_mentioned_user_ids(recipients)
    return [] if body.blank?

    handles = body.scan(MENTION_REGEX).flatten.map(&:downcase).uniq
    return [] if handles.empty?

    recipients.select do |participant|
      mention_handles_for(participant).any? { |handle| handles.include?(handle) }
    end.map(&:id)
  end

  def mention_handles_for(participant)
    [
      participant.email.to_s.split("@").first,
      participant.full_name.to_s,
      [ participant.first_name, participant.last_name ].compact.join(" "),
      participant.first_name.to_s
    ].map { |value| value.to_s.downcase.strip.gsub(/\s+/, ".") }
      .reject(&:blank?)
      .uniq
  end
end
