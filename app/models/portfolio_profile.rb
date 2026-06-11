class PortfolioProfile < ApplicationRecord
  MAX_AVATAR_SIZE = 5.megabytes
  MAX_RESUME_SIZE = 10.megabytes

  has_one_attached :avatar
  has_one_attached :resume

  validates :full_name, :headline, :summary, presence: true
  validate :validate_media

  scope :published, -> { where(published: true) }

  private

  def validate_media
    validate_attachment(avatar, %w[image/png image/jpeg image/webp], MAX_AVATAR_SIZE, "Avatar")
    validate_attachment(resume, ["application/pdf"], MAX_RESUME_SIZE, "Resume")
  end

  def validate_attachment(attachment, allowed_types, max_size, label)
    return unless attachment.attached?

    errors.add(attachment.name, "#{label} must use an allowed file type") unless allowed_types.include?(attachment.blob.content_type)
    errors.add(attachment.name, "#{label} must be smaller than #{max_size / 1.megabyte} MB") if attachment.blob.byte_size > max_size
  end
end
