class CreateProjectEnvironments < ActiveRecord::Migration[7.1]
  def change
    create_table :project_environments do |t|
      t.references :project, null: false, foreign_key: true
      t.string :name, null: false
      t.string :url
      t.text :description

      t.timestamps
    end

    add_index :project_environments, [:project_id, :name], unique: true
  end
end
