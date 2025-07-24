class TeamUser < ApplicationRecord
  belongs_to :team
  belongs_to :user

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
