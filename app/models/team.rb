class Team < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true, inverse_of: :owned_teams

  has_many :team_users, dependent: :destroy, inverse_of: :team
  has_many :users, through: :team_users
  has_many :learning_goals, dependent: :destroy, inverse_of: :team
  has_many :skill_endorsements, dependent: :nullify, inverse_of: :team

  validates :name, presence: true
end
