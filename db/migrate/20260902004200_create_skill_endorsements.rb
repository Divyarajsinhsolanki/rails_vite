class CreateSkillEndorsements < ActiveRecord::Migration[7.1]
  def change
    create_table :skill_endorsements do |t|
      t.references :user_skill, null: false, foreign_key: true
      t.references :endorser, null: false, foreign_key: { to_table: :users }
      t.references :team, foreign_key: true
      t.text :note
      t.timestamps
    end

    add_index :skill_endorsements, [:endorser_id, :user_skill_id], unique: true, name: 'index_skill_endorsements_on_endorser_and_user_skill'
  end
end
