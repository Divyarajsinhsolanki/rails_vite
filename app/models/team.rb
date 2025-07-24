class Team < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true

  has_many :team_users, dependent: :destroy
  has_many :users, through: :team_users

  validates :name, presence: true
end
