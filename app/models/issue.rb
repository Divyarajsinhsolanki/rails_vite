class Issue < ApplicationRecord
  belongs_to :project
  belongs_to :reporter, class_name: 'User', optional: true
  belongs_to :assignee_user, class_name: 'User', optional: true

  STATUSES = [
    'New',
    'In Progress',
    'Blocked',
    'Resolved',
    'Not Reproducible',
    'Need to discuss',
    'Retest',
    'Not an issue'
  ].freeze

  SEVERITIES = %w[Low Medium High Critical].freeze

  # QA Testing status options
  QA_STATUSES = %w[Y N].freeze

  has_many_attached :media_files

  validates :issue_key, presence: true, uniqueness: true
  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :severity, inclusion: { in: SEVERITIES }

  before_validation :ensure_issue_key
  before_validation :normalize_status_and_severity
  after_commit :notify_assignment_or_status_change, on: %i[create update]

  private

  def ensure_issue_key
    self.issue_key ||= "ISS-#{SecureRandom.hex(3).upcase}"
  end

  def normalize_status_and_severity
    self.status = canonical_enum_value(status, STATUSES, 'New')
    self.severity = canonical_enum_value(severity, SEVERITIES, 'Medium')
  end

  def canonical_enum_value(value, allowed_values, fallback)
    normalized = value.to_s.strip
    return fallback if normalized.blank?

    allowed_values.find { |allowed_value| enum_key(allowed_value) == enum_key(normalized) } || normalized
  end

  def enum_key(value)
    value.to_s.tr('_-', ' ').squish.downcase
  end

  def notify_assignment_or_status_change
    return unless saved_change_to_assignee? || saved_change_to_status?

    previous_status = saved_change_to_status? ? saved_change_to_status.first : nil
    previous_assignee = saved_change_to_assignee? ? saved_change_to_assignee.first : nil
    IssueNotifierJob.perform_later(id, previous_status, previous_assignee)
  end
end
