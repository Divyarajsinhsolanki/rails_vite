class WorkCategory < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  has_many :work_logs, dependent: :nullify, inverse_of: :category

  validates :name, presence: true
end
