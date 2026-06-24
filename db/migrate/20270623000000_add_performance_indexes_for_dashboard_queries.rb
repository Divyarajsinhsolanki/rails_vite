class AddPerformanceIndexesForDashboardQueries < ActiveRecord::Migration[8.0]
  def change
    add_index :tasks, [:workspace_id, :end_date], name: "index_tasks_on_workspace_id_and_end_date", if_not_exists: true
    add_index :tasks, [:workspace_id, :assigned_to_user, :end_date], name: "index_tasks_on_workspace_assignee_end_date", if_not_exists: true
    add_index :tasks, [:workspace_id, :project_id, :end_date], name: "index_tasks_on_workspace_project_end_date", if_not_exists: true
    add_index :tasks, [:workspace_id, :sprint_id, :developer_id, :order], name: "index_tasks_on_workspace_sprint_developer_order", if_not_exists: true

    add_index :users, [:workspace_id, :created_at], name: "index_users_on_workspace_id_and_created_at", if_not_exists: true
    add_index :work_logs, [:user_id, :log_date], name: "index_work_logs_on_user_id_and_log_date", if_not_exists: true
    add_index :knowledge_bookmarks, [:user_id, :next_reminder_at], name: "index_knowledge_bookmarks_on_user_next_reminder", if_not_exists: true
  end
end
