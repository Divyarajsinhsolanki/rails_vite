class CreateKnowledgeBookmarks < ActiveRecord::Migration[7.1]
  def change
    create_table :knowledge_bookmarks do |t|
      t.references :user, null: false, foreign_key: true
      t.string :card_type, null: false
      t.string :collection_name
      t.string :source_id
      t.jsonb :payload, null: false, default: {}
      t.datetime :last_viewed_at
      t.datetime :last_reminded_at
      t.datetime :next_reminder_at
      t.integer :reminder_interval_days, null: false, default: 7

      t.timestamps
    end

    add_index :knowledge_bookmarks, [:user_id, :card_type, :source_id], unique: true, name: "index_knowledge_bookmarks_on_identity"
    add_index :knowledge_bookmarks, :next_reminder_at
    add_index :knowledge_bookmarks, :collection_name
  end
end
