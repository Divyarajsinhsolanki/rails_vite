class AddJobTitleToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :job_title, :string, null: false, default: 'Team Member'
  end
end
