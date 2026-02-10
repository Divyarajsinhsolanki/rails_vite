class CalendarEvent < ApplicationRecord
  EVENT_TYPES = %w[meeting deadline reminder focus sprint_ceremony].freeze

  belongs_to :user
  belongs_to :project, optional: true
  belongs_to :task, optional: true
  belongs_to :sprint, optional: true

  has_many :event_reminders, dependent: :destroy

  enum visibility: {
    personal: 'personal',
    project: 'project'
  }, _default: 'personal'

  enum status: {
    scheduled: 'scheduled',
    cancelled: 'cancelled',
    completed: 'completed'
  }, _default: 'scheduled'

  validates :title, :start_at, :end_at, :event_type, :visibility, :status, presence: true
  validates :event_type, inclusion: { in: EVENT_TYPES }
  validate :end_after_start
  validate :project_required_for_project_visibility

  scope :within_range, ->(start_time, end_time) {
    where('start_at < ? AND end_at > ?', end_time, start_time)
  }

  def as_api_json
    as_json(
      only: [:id, :title, :description, :start_at, :end_at, :all_day, :event_type, :visibility, :status, :location_or_meet_link, :project_id, :task_id, :sprint_id, :user_id, :created_at, :updated_at],
      include: {
        event_reminders: {
          only: [:id, :channel, :minutes_before, :send_at, :sent_at, :state]
        }
      }
    )
  end

  private

  def end_after_start
    return if start_at.blank? || end_at.blank?
    return if end_at >= start_at

    errors.add(:end_at, 'must be on or after start_at')
  end

  def project_required_for_project_visibility
    return unless visibility == 'project' && project_id.blank?

    errors.add(:project_id, 'is required for project events')
  end
end
