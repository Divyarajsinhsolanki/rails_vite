class AddQaFieldsToTasks < ActiveRecord::Migration[7.1]
  def change
    add_column :tasks, :qa_assigned, :string
    add_column :tasks, :internal_qa, :string
    add_column :tasks, :blocker, :boolean, default: false, null: false
    add_column :tasks, :demo, :boolean, default: false, null: false
    add_column :tasks, :swag_point, :decimal, precision: 6, scale: 2
    add_column :tasks, :story_point, :decimal, precision: 6, scale: 2
    add_column :tasks, :dev_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :code_review_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :dev_to_qa_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :qa_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :automation_qa_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :total_hours, :decimal, precision: 6, scale: 2
    add_column :tasks, :priority, :string
  end
end
