class User < ApplicationRecord
  include UserStampable

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_one_attached :profile_picture
  has_many :posts, dependent: :destroy
  has_many :tasks, foreign_key: :assigned_to_user
  has_many :items

  validates :first_name, presence: true
  validates :last_name, presence: true

  # This is a class attribute that will store the current user for the current request.
  # It needs to be thread-safe.
  cattr_accessor :current_user
end
