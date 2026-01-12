class IssueNotifierJob < ApplicationJob
  queue_as :default

  def perform(issue_id, previous_status = nil, previous_assignee = nil)
    issue = Issue.find_by(id: issue_id)
    return unless issue

    IssueNotifier.new(issue, previous_status:, previous_assignee:).notify
  end
end
