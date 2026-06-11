class IssueNotifierJob < ApplicationJob
  queue_as :default

  def perform(issue_id, previous_status = nil, previous_assignee = nil)
    issue = Issue.unscoped.find_by(id: issue_id)
    return unless issue
    return if issue.workspace.demo?

    Current.set(workspace: issue.workspace) do
      IssueNotifier.new(issue, previous_status:, previous_assignee:).notify
    end
  end
end
