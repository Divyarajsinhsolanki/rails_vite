class ProjectEnvironment < ApplicationRecord
  belongs_to :project, inverse_of: :project_environments
  has_many :project_vault_items, dependent: :nullify

  validates :name, presence: true
  validates :name, uniqueness: { scope: :project_id, message: "already exists for this project" }
end
