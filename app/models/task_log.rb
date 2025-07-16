class TaskLog < ApplicationRecord
  include UserStampable

  belongs_to :task
  belongs_to :developer

  self.inheritance_column = 'non_existent_type_column'

  validates :task, :developer, :log_date, :hours_logged, presence: true
  validates :hours_logged, numericality: true

  after_save :sync_task_dates, if: -> { type == 'Code' }

  private

  def sync_task_dates
    return unless task

    code_logs = task.task_logs.where(type: 'Code')
    task.update(
      start_date: code_logs.minimum(:log_date),
      end_date: code_logs.maximum(:log_date)
    )
  end
end
