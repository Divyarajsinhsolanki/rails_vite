class CreatePosts < ActiveRecord::Migration[7.1]
  def change
    create_table :posts do |t|
      t.string :message
      t.string :image
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
