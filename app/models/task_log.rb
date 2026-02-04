class TaskLog < ApplicationRecord
  include UserStampable

  belongs_to :task, inverse_of: :task_logs
  belongs_to :developer, inverse_of: :task_logs

  self.inheritance_column = 'non_existent_type_column'

  validates :task, :developer, :log_date, :hours_logged, presence: true
  validates :hours_logged, numericality: true

  before_destroy :store_task_date_sync_context
  after_commit :sync_task_dates, on: [:create, :update, :destroy]

  private

  def sync_task_dates
    task_ids = []
    if destroyed?
      return unless @destroyed_type == 'Code'

      task_ids << @destroyed_task_id
    else
      return unless code_log_change?

      task_ids << task_id
      if (previous_task_id = previous_changes.dig('task_id', 0))
        task_ids << previous_task_id
      end
    end

    task_ids.compact.uniq.each do |task_id|
      task = Task.find_by(id: task_id)
      next unless task

      code_logs = task.task_logs.where(type: 'Code')
      task.update(
        start_date: code_logs.minimum(:log_date),
        end_date: code_logs.maximum(:log_date)
      )
    end
  end

  def code_log_change?
    return true if type == 'Code'

    previous_changes['type']&.include?('Code')
  end

  def store_task_date_sync_context
    @destroyed_task_id = task_id
    @destroyed_type = type
  end
end
