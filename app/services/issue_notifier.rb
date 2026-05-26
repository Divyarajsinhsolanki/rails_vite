require "net/http"
require "uri"

class IssueNotifier
  def initialize(issue, previous_status:, previous_assignee:)
    @issue = issue
    @previous_status = previous_status
    @previous_assignee = previous_assignee
  end

  SLACK_MAX_RETRIES = 3

  def notify
    send_email if email_targets.any?

    return unless slack_webhook.present?

    send_slack
  end

  private

  attr_reader :issue, :previous_status, :previous_assignee

  def email_targets
    @email_targets ||= [issue.assignee_email, issue.owner_email].compact_blank.uniq
  end

  def send_email
    IssueMailer.issue_update(
      issue,
      previous_status: previous_status,
      previous_assignee: previous_assignee,
      targets: email_targets
    ).deliver_later
  end

  def send_slack
    payload = {
      text: ["Issue #{issue.issue_key || issue.id}: #{issue.title}", issue.assignee_slack.presence].compact.join(" "),
      attachments: [
        {
          color: status_color(issue.status),
          fields: [
            { title: "Status", value: status_line, short: true },
            { title: "Assignee", value: assignee_line, short: true },
            { title: "Due date", value: due_date_line, short: true },
          ]
        }
      ]
    }

    uri = URI(slack_webhook)

    with_slack_retries do
      response = Net::HTTP.post(uri, payload.to_json, { "Content-Type" => "application/json" })
      next if response.is_a?(Net::HTTPSuccess)

      raise "Slack webhook returned #{response.code}: #{response.body.to_s.first(200)}"
    end
  end

  def with_slack_retries
    attempts = 0

    begin
      attempts += 1
      yield
    rescue StandardError => e
      if attempts < SLACK_MAX_RETRIES
        sleep(0.2 * attempts)
        retry
      end

      AppEventLogger.error(
        :application_errors,
        source: self.class.name,
        message: "IssueNotifier Slack delivery failed",
        exception: e,
        payload: { issue_id: issue.id, issue_key: issue.issue_key }
      )
      raise
    end
  end

  def status_line
    return issue.status unless previous_status.present? && previous_status != issue.status

    "#{previous_status} → #{issue.status}"
  end

  def assignee_line
    current = issue.assignee.presence || "Unassigned"
    return current unless previous_assignee.present? && previous_assignee != issue.assignee

    "#{previous_assignee} → #{current}"
  end

  def due_date_line
    issue.due_date&.strftime("%Y-%m-%d") || "Not set"
  end

  def slack_webhook
    ENV["SLACK_WEBHOOK_URL"].to_s
  end

  def status_color(status)
    {
      "New" => "#0ea5e9",
      "In Progress" => "#f59e0b",
      "Blocked" => "#ef4444",
      "Resolved" => "#10b981"
    }[status] || "#94a3b8"
  end
end
