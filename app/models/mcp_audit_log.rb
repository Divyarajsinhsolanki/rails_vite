class McpAuditLog < ApplicationRecord
  include WorkspaceScoped

  belongs_to :user
  belongs_to :mcp_access_token, optional: true

  validates :tool_name, :action, presence: true
end
