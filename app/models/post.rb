class Post < ApplicationRecord
  include UserStampable

  belongs_to :user
  has_one_attached :image
  has_many :post_likes, dependent: :destroy
  has_many :liked_users, through: :post_likes, source: :user
  has_many :comments, dependent: :destroy
  validates :message, presence: true, unless: -> { image.attached? }
end
