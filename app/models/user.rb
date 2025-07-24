class User < ApplicationRecord
  include UserStampable

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable

  enum status: { invited: "invited", active: "active", locked: "locked" }, _default: "invited"

  has_one_attached :profile_picture
  has_many :posts, dependent: :destroy
  has_many :tasks, foreign_key: :assigned_to_user
  has_many :items
  has_many :team_users, dependent: :destroy
  has_many :teams, through: :team_users
  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles
  has_many :project_users, dependent: :destroy
  has_many :projects, through: :project_users

  validates :first_name, presence: true
  validates :last_name, presence: true

  cattr_accessor :current_user

  private

  def after_confirmation
    update_column(:status, "active")
  end
end
