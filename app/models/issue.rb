class Issue < ApplicationRecord
  belongs_to :project

  STATUSES = %w[New In\ Progress Blocked Resolved].freeze
  SEVERITIES = %w[Low Medium High Critical].freeze

  has_many_attached :media_files

  validates :issue_key, presence: true, uniqueness: true
  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }, allow_blank: true
  validates :severity, inclusion: { in: SEVERITIES }, allow_blank: true

  before_validation :ensure_issue_key
  before_validation :normalize_status_and_severity

  private

  def ensure_issue_key
    self.issue_key ||= "ISS-#{SecureRandom.hex(3).upcase}"
  end

  def normalize_status_and_severity
    self.status = status.presence || 'New'
    self.severity = severity.presence || 'Medium'
  end
end
