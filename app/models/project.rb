class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true

  has_many :project_users, dependent: :destroy
  has_many :users, through: :project_users
  has_many :sprints, dependent: :destroy

  validates :name, presence: true
end
