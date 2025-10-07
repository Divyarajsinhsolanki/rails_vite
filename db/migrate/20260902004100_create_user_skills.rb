class CreateUserSkills < ActiveRecord::Migration[7.1]
  def change
    create_table :user_skills do |t|
      t.references :user, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.string :proficiency, null: false, default: 'beginner'
      t.integer :endorsements_count, null: false, default: 0
      t.datetime :last_endorsed_at
      t.timestamps
    end

    add_index :user_skills, [:user_id, :skill_id], unique: true
  end
end
