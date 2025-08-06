class AddWorkloadToProjectUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :project_users, :allocation_percentage, :integer, default: 0, null: false
    add_column :project_users, :workload_status, :string, default: 'partial', null: false
  end
end
