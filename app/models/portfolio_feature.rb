class PortfolioFeature < ApplicationRecord
  belongs_to :portfolio_project
  has_one_attached :screenshot

  validates :category, :title, :summary, presence: true

  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position, :id) }
end
