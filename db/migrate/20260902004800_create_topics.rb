class CreateTopics < ActiveRecord::Migration[7.1]
  def change
    create_table :topics do |t|
      t.string :name, null: false
      t.text :description
      t.integer :topic_follows_count, null: false, default: 0

      t.timestamps
    end

    add_index :topics, :name, unique: true
  end
end
