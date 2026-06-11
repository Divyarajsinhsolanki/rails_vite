class WorkPriority < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  has_many :work_logs, dependent: :nullify, inverse_of: :priority

  validates :name, presence: true
end
