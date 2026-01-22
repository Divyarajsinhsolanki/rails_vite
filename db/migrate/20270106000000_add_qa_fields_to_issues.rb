class AddQaFieldsToIssues < ActiveRecord::Migration[7.1]
  def change
    # QA Testing status fields
    add_column :issues, :section_detail, :string
    add_column :issues, :mf6_app, :string
    add_column :issues, :local_qa, :string
    add_column :issues, :team_test, :string

    # Comment fields for different stakeholders
    add_column :issues, :comment_qa, :text
    add_column :issues, :dev_comments_dated, :text
    add_column :issues, :developer_comment, :text

    # Rails 4 compatibility tracking
    add_column :issues, :issue_present_in_rails4, :string

    # User references for reporter and assignee
    add_reference :issues, :reporter, foreign_key: { to_table: :users }, null: true
    add_reference :issues, :assignee_user, foreign_key: { to_table: :users }, null: true

    # Indexes for common lookups
    add_index :issues, :mf6_app
    add_index :issues, :local_qa
    add_index :issues, :team_test
  end
end
