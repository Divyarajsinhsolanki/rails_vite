class WorkLog < ApplicationRecord
  include UserStampable

  belongs_to :user, inverse_of: :work_logs
  belongs_to :category, class_name: 'WorkCategory', optional: true, inverse_of: :work_logs
  belongs_to :priority, class_name: 'WorkPriority', optional: true, inverse_of: :work_logs

  has_many :work_log_tags, dependent: :destroy, inverse_of: :work_log
  has_many :tags, through: :work_log_tags, source: :work_tag, class_name: 'WorkTag'

  validates :title, :log_date, :start_time, :end_time, presence: true
  validate :end_time_after_start_time

  private

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?

    if end_time <= start_time
      errors.add(:end_time, "must be after start time")
    end
  end
end
