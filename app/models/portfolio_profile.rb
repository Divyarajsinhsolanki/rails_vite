class PortfolioProfile < ApplicationRecord
  has_one_attached :avatar
  has_one_attached :resume

  validates :full_name, :headline, :summary, presence: true

  scope :published, -> { where(published: true) }
end
