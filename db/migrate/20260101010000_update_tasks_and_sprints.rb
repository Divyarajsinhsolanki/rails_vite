class UpdateTasksAndSprints < ActiveRecord::Migration[7.1]
  def change
    if column_exists?(:tasks, :date)
      remove_column :tasks, :date, :date
    end

    if column_exists?(:tasks, :is_struck)
      remove_column :tasks, :is_struck, :boolean
    end

    if column_exists?(:tasks, :due_date)
      remove_column :tasks, :due_date, :date
    end

    if column_exists?(:sprints, :description)
      remove_column :sprints, :description, :text
    end

    if column_exists?(:sprints, :order)
      remove_column :sprints, :order, :integer
    end

    unless column_exists?(:sprints, :created_at) && column_exists?(:sprints, :updated_at)
      add_timestamps :sprints, null: true
      change_column_null :sprints, :created_at, false
      change_column_null :sprints, :updated_at, false
    end
  end
end
