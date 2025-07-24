class CreateProjectUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :project_users do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.string :role, null: false, default: "collaborator"
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :project_users, [:project_id, :user_id], unique: true
  end
end
