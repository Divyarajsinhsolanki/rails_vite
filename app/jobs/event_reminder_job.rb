class EventReminderJob < ApplicationJob
  queue_as :default

  def perform(event_reminder_id)
    reminder = EventReminder.unscoped.includes(calendar_event: :user).find_by(id: event_reminder_id)
    return unless reminder&.pending?
    return if reminder.workspace.demo?

    Current.set(workspace: reminder.workspace) do
      EventReminderChannels::Deliverer.call(reminder)
      reminder.update!(state: 'sent', sent_at: Time.current)
    end
  rescue StandardError
    reminder&.update(state: 'failed') if reminder&.pending?
    raise
  end
end
