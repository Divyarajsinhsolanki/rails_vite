class Post < ApplicationRecord
  include UserStampable

  belongs_to :user
  has_one_attached :image
  has_many :post_likes, dependent: :destroy
  has_many :liked_users, through: :post_likes, source: :user
  validates :message, presence: true, unless: -> { image.attached? }
end
