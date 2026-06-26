class CreateMcpAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :mcp_audit_logs do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :mcp_access_token, foreign_key: true
      t.string :tool_name, null: false
      t.string :action, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :mcp_audit_logs, [:workspace_id, :created_at]
    add_index :mcp_audit_logs, [:tool_name, :action]
  end
end
