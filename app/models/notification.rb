class Notification < ApplicationRecord
  belongs_to :recipient, class_name: "User"
  belongs_to :actor, class_name: "User"
  belongs_to :notifiable, polymorphic: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  before_create :respect_recipient_preferences

  def mark_as_read!
    update!(read_at: Time.current)
  end

  private

  def respect_recipient_preferences
    return if recipient.blank?
    return if recipient.notification_preference_enabled?(action)

    throw(:abort)
  end
end
