class AddKekaFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :keka_base_url, :string
    add_column :users, :keka_api_key, :string
    add_column :users, :keka_employee_id, :string
    add_column :users, :keka_profile_data, :jsonb, default: {}, null: false
    add_column :users, :keka_last_synced_at, :datetime
  end
end
