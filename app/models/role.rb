class Role < ApplicationRecord
  NAMES = %w[owner admin member project_manager team_leader].freeze

  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles

  validates :name, presence: true, uniqueness: true, inclusion: { in: NAMES }
end
