class CreateTeamUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :team_users do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.string :role, null: false, default: "member"
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :team_users, [:team_id, :user_id], unique: true
  end
end
