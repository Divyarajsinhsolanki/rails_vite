class AddTitleDescriptionAndDatesToTasks < ActiveRecord::Migration[7.1]
  def change
    add_column :tasks, :title, :string
    add_column :tasks, :description, :text
    add_column :tasks, :start_date, :date
    add_column :tasks, :end_date, :date
  end
end
