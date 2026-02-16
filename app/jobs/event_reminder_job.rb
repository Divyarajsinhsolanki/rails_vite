class EventReminderJob < ApplicationJob
  queue_as :default

  def perform(event_reminder_id)
    reminder = EventReminder.includes(calendar_event: :user).find_by(id: event_reminder_id)
    return unless reminder&.pending?

    EventReminderChannels::Deliverer.call(reminder)
    reminder.update!(state: 'sent', sent_at: Time.current)
  rescue StandardError
    reminder&.update(state: 'failed') if reminder&.pending?
    raise
  end
end
