class RemoveAssignedToDeveloperFromTasks < ActiveRecord::Migration[7.1]
  def change
    if column_exists?(:tasks, :assigned_to_developer)
      remove_column :tasks, :assigned_to_developer, :integer
    end
  end
end
