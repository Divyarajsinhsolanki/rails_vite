class AllowNullTaskIdAndDeveloperIdInTasks < ActiveRecord::Migration[7.1]
  def change
    change_column_null :tasks, :task_id, true
    change_column_null :tasks, :developer_id, true
  end
end
