class Department < ApplicationRecord
  include WorkspaceScoped

  belongs_to :manager, class_name: "User", optional: true
  has_many :users, dependent: :nullify

  validates :name, presence: true, uniqueness: { scope: :workspace_id }
end
