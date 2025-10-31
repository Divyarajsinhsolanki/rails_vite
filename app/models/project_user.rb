class ProjectUser < ApplicationRecord
  belongs_to :project, inverse_of: :project_users
  belongs_to :user, inverse_of: :project_users

  enum role: {
    owner: 'owner',
    manager: 'manager',
    collaborator: 'collaborator',
    viewer: 'viewer'
  }, _default: 'collaborator'

  enum status: {
    invited: 'invited',
    requested: 'requested',
    active: 'active',
    removed: 'removed'
  }, _default: 'active'

  WORKLOAD_STATUSES = %w[free partial full overloaded].freeze

  validates :workload_status, inclusion: { in: WORKLOAD_STATUSES }
  validates :allocation_percentage, numericality: {
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 100,
    only_integer: true
  }
end
