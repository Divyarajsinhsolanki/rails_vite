class WorkPriority < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  validates :name, presence: true, uniqueness: { scope: :workspace_id }

  has_many :work_logs, dependent: :nullify, inverse_of: :priority
end
