class AddAssignmentFieldsToIssues < ActiveRecord::Migration[7.1]
  def change
    add_column :issues, :owner, :string
    add_column :issues, :owner_email, :string
    add_column :issues, :assignee, :string
    add_column :issues, :assignee_email, :string
    add_column :issues, :assignee_slack, :string
    add_column :issues, :due_date, :date

    add_index :issues, :assignee
    add_index :issues, :due_date
  end
end
