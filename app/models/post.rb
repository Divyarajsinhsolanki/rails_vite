class Post < ApplicationRecord
  belongs_to :user
  has_one_attached :image
  validates :message, presence: true, unless: -> { image.attached? }
end
