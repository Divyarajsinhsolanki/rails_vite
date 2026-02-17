class CreateChatCore < ActiveRecord::Migration[7.1]
  def change
    create_table :conversations do |t|
      t.string :title
      t.string :conversation_type, null: false, default: "direct"
      t.references :creator, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :conversations, :conversation_type

    create_table :conversation_participants do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :last_read_at

      t.timestamps
    end

    add_index :conversation_participants, [:conversation_id, :user_id], unique: true, name: "idx_unique_conversation_participant"

    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :body

      t.timestamps
    end

    add_index :messages, [:conversation_id, :created_at]
  end
end
