class ProjectUser < ApplicationRecord
  belongs_to :project
  belongs_to :user

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
end
