class User < ApplicationRecord
  include UserStampable

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable

  enum status: { invited: "invited", active: "active", locked: "locked" }, _default: "invited"

  has_one_attached :profile_picture
  has_many :posts, dependent: :destroy
  has_many :tasks, foreign_key: :assigned_to_user
  has_many :items

  validates :first_name, presence: true
  validates :last_name, presence: true

  cattr_accessor :current_user

  private

  def after_confirmation
    update_column(:status, "active")
  end
end
