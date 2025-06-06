class Post < ApplicationRecord
  include UserStampable

  belongs_to :user
  has_one_attached :image
  validates :message, presence: true, unless: -> { image.attached? }
end
