class CreateTopicFollows < ActiveRecord::Migration[7.1]
  def change
    create_table :topic_follows do |t|
      t.references :user, null: false, foreign_key: true
      t.references :topic, null: false, foreign_key: true

      t.timestamps
    end

    add_index :topic_follows, [:user_id, :topic_id], unique: true
  end
end
