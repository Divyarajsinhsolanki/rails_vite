class Task < ApplicationRecord
  include UserStampable

  attr_accessor :skip_default_log_backfill

  DEFAULT_CODE_LOG_TYPE = 'Code'.freeze
  DEFAULT_CODE_LOG_HOURS = 1

  belongs_to :sprint, optional: true, inverse_of: :tasks
  belongs_to :developer, optional: true, inverse_of: :tasks
  belongs_to :project, optional: true, inverse_of: :tasks
  belongs_to :assigned_user, class_name: 'User', foreign_key: :assigned_to_user, optional: true, inverse_of: :tasks

  has_many :task_logs, dependent: :destroy, inverse_of: :task

  # This tells ActiveRecord NOT to use the 'type' column for Single Table Inheritance.
  self.inheritance_column = 'non_existent_type_column'

  after_create :backfill_default_code_log

  validates :task_id, presence: true, unless: :general?
  validates :developer, presence: true, unless: :general?
  validates :type, presence: true
  validates :title, presence: true, if: :general?

  private

  def skip_default_log_backfill?
    ActiveModel::Type::Boolean.new.cast(@skip_default_log_backfill)
  end

  def backfill_default_code_log
    return if skip_default_log_backfill?
    return unless developer_id.present? && estimated_hours.present?

    metadata = default_log_metadata
    task_logs.create!(
      developer: developer,
      log_date: metadata[:log_date],
      hours_logged: metadata[:hours_logged],
      type: metadata[:type]
    )
  rescue StandardError => e
    Rails.logger.warn("Failed to backfill default task log for Task##{id}: #{e.message}") if Rails.logger
  end

  def default_log_metadata
    {
      log_date: start_date || Date.current,
      hours_logged: estimated_hours.presence || DEFAULT_CODE_LOG_HOURS,
      type: DEFAULT_CODE_LOG_TYPE
    }
  end

  def general?
    type == 'general'
  end
end
