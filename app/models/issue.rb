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
  validates :status, inclusion: { in: STATUSES }, allow_blank: true
  validates :severity, inclusion: { in: SEVERITIES }, allow_blank: true

  before_validation :ensure_issue_key
  before_validation :normalize_status_and_severity
  after_commit :notify_assignment_or_status_change, on: %i[create update]

  private

  def ensure_issue_key
    self.issue_key ||= "ISS-#{SecureRandom.hex(3).upcase}"
  end

  def normalize_status_and_severity
    self.status = status.presence || 'New'
    self.severity = severity.presence || 'Medium'
  end

  def notify_assignment_or_status_change
    return unless saved_change_to_assignee? || saved_change_to_status?

    previous_status = saved_change_to_status? ? saved_change_to_status.first : nil
    previous_assignee = saved_change_to_assignee? ? saved_change_to_assignee.first : nil
    IssueNotifierJob.perform_later(id, previous_status, previous_assignee)
  end
end

