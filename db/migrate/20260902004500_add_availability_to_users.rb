class AddAvailabilityToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :availability_status, :string, null: false, default: 'available_now'
    add_column :users, :current_projects_count, :integer, null: false, default: 0
    add_index :users, :availability_status
  end
end
