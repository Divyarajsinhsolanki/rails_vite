class PortfolioProject < ApplicationRecord
  MAX_COVER_SIZE = 8.megabytes

  has_one_attached :cover_image
  has_many :portfolio_features, dependent: :destroy

  validates :title, :slug, :summary, presence: true
  validates :slug, uniqueness: true
  validate :validate_cover_image

  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position, :id) }

  private

  def validate_cover_image
    return unless cover_image.attached?

    unless %w[image/png image/jpeg image/webp].include?(cover_image.blob.content_type)
      errors.add(:cover_image, "must be PNG, JPEG, or WebP")
    end
    errors.add(:cover_image, "must be smaller than 8 MB") if cover_image.blob.byte_size > MAX_COVER_SIZE
  end
end
