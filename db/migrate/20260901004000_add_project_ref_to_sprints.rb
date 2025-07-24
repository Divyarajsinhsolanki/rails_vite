class AddProjectRefToSprints < ActiveRecord::Migration[7.1]
  def change
    remove_column :sprints, :project_id, :integer
    add_reference :sprints, :project, null: false, foreign_key: true
  end
end
