class AddProfileContactAndSocialsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :phone_number, :string
    add_column :users, :bio, :text
    add_column :users, :social_links, :jsonb, default: {}, null: false
  end
end
