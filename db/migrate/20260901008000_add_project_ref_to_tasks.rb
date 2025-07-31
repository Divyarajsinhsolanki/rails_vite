class AddProjectRefToTasks < ActiveRecord::Migration[7.1]
  def change
    add_reference :tasks, :project, null: true, foreign_key: true
  end
end
