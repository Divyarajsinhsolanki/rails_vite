class AddIndexesToFrequentlyQueriedColumns < ActiveRecord::Migration[7.1]
  def change
    add_index :posts, :created_at unless index_exists?(:posts, :created_at)
    add_index :post_likes, [:post_id, :user_id], unique: true unless index_exists?(:post_likes, [:post_id, :user_id], unique: true)
    add_index :notifications, [:recipient_id, :read_at] unless index_exists?(:notifications, [:recipient_id, :read_at])
  end
end
