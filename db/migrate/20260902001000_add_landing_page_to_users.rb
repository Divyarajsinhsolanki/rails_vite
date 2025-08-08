class AddLandingPageToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :landing_page, :string, default: 'posts'
  end
end
