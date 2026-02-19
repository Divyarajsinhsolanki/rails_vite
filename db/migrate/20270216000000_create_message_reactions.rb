class CreateMessageReactions < ActiveRecord::Migration[7.1]
  def change
    create_table :message_reactions do |t|
      t.references :message, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :emoji, null: false

      t.timestamps
    end

    add_index :message_reactions, [:message_id, :user_id, :emoji], unique: true, name: "idx_unique_message_reaction"
  end
end
