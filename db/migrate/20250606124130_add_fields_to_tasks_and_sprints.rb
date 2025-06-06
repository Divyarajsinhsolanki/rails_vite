class AddFieldsToTasksAndSprints < ActiveRecord::Migration[7.1]
  def change
    # Tasks table
    add_column :tasks, :status, :string, default: "todo"
    add_column :tasks, :order, :integer, default: 0
    add_column :tasks, :assigned_to, :integer
    add_column :tasks, :created_by, :integer
    add_column :tasks, :updated_by, :integer
    add_column :tasks, :due_date, :date

    # Sprints table
    add_column :sprints, :status, :string, default: "todo"
    add_column :sprints, :progress, :integer, default: 0
    add_column :sprints, :order, :integer, default: 0
    add_column :sprints, :project_id, :integer
    add_column :sprints, :created_by, :integer
    add_column :sprints, :updated_by, :integer
  end
end
