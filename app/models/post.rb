class Post < ApplicationRecord
  include UserStampable

  belongs_to :user, inverse_of: :posts
  has_one_attached :image
  has_many :post_likes, dependent: :destroy, inverse_of: :post
  has_many :liked_users, through: :post_likes, source: :user
  has_many :comments, dependent: :destroy, inverse_of: :post
  validates :message, presence: true, unless: -> { image.attached? }
end
