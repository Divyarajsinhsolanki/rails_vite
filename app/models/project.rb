class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true

  has_many :project_users, dependent: :destroy
  has_many :users, through: :project_users

  validates :name, presence: true
end
