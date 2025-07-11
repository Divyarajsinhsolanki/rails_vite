class SplitAssignedToColumns < ActiveRecord::Migration[7.1]
  def change
    rename_column :tasks, :assigned_to, :assigned_to_user
    add_column :tasks, :assigned_to_developer, :integer
  end
end
