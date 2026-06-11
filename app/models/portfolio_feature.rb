class PortfolioFeature < ApplicationRecord
  MAX_SCREENSHOT_SIZE = 8.megabytes

  belongs_to :portfolio_project
  has_one_attached :screenshot

  validates :category, :title, :summary, presence: true
  validate :validate_screenshot

  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position, :id) }
  scope :tour_ordered, -> { order(:tour_position, :position, :id) }

  private

  def validate_screenshot
    return unless screenshot.attached?

    unless %w[image/png image/jpeg image/webp].include?(screenshot.blob.content_type)
      errors.add(:screenshot, "must be PNG, JPEG, or WebP")
    end
    errors.add(:screenshot, "must be smaller than 8 MB") if screenshot.blob.byte_size > MAX_SCREENSHOT_SIZE
  end
end
