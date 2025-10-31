class TeamUser < ApplicationRecord
  belongs_to :team, inverse_of: :team_users
  belongs_to :user, inverse_of: :team_users

  enum role: {
    admin: 'admin',
    member: 'member',
    viewer: 'viewer'
  }, _default: 'member'

  enum status: {
    invited: 'invited',
    requested: 'requested',
    accepted: 'accepted',
    rejected: 'rejected',
    pending: 'pending'
  }, _default: 'pending'
end
