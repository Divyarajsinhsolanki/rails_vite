class KnowledgeBookmark < ApplicationRecord
  belongs_to :user

  validates :card_type, presence: true
  validates :payload, presence: true
  validates :reminder_interval_days, numericality: { greater_than: 0 }

  before_validation :initialize_tracking_fields, on: :create

  scope :due_for_reminder, -> { where.not(next_reminder_at: nil).where('next_reminder_at <= ?', Time.current) }

  def mark_reviewed!
    touch(:last_viewed_at)
    update!(next_reminder_at: Time.current + reminder_interval_days.days)
  end

  def schedule_next_reminder!
    update!(next_reminder_at: Time.current + reminder_interval_days.days, last_reminded_at: Time.current)
  end

  private

  def initialize_tracking_fields
    self.last_viewed_at ||= Time.current
    self.next_reminder_at ||= Time.current + reminder_interval_days.days
  end
end
