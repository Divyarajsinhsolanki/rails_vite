class TeamUser < ApplicationRecord
  include WorkspaceScoped

  belongs_to :team, inverse_of: :team_users
  belongs_to :user, inverse_of: :team_users

  enum :role, {
    admin: 'admin',
    member: 'member',
    viewer: 'viewer'
  }, default: 'member'

  enum :status, {
    invited: 'invited',
    requested: 'requested',
    accepted: 'accepted',
    rejected: 'rejected',
    pending: 'pending'
  }, default: 'pending'
end
