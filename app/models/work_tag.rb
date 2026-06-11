class WorkTag < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  has_many :work_log_tags, dependent: :destroy, inverse_of: :work_tag
  has_many :work_logs, through: :work_log_tags

  validates :name, presence: true, uniqueness: { scope: :workspace_id }
end
