class PortfolioProject < ApplicationRecord
  has_one_attached :cover_image
  has_many :portfolio_features, dependent: :destroy

  validates :title, :slug, :summary, presence: true
  validates :slug, uniqueness: true

  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position, :id) }
end
