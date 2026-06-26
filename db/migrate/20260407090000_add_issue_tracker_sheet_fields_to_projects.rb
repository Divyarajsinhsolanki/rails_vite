class AddIssueTrackerSheetFieldsToProjects < ActiveRecord::Migration[7.1]
  def change
    return unless table_exists?(:projects)

    add_column :projects, :issue_sheet_id, :string
    add_column :projects, :issue_sheet_name, :string, default: "Issue Tracker", null: false
  end
end
