class EventReminderJob < ApplicationJob
  queue_as :default

  def perform(event_reminder_id)
    reminder = EventReminder.includes(calendar_event: :user).find_by(id: event_reminder_id)
    return unless reminder&.pending?

    event = reminder.calendar_event
    recipient = event.user

    Notification.create(
      recipient: recipient,
      actor: recipient,
      action: 'update',
      notifiable: event,
      metadata: {
        type: 'calendar_reminder',
        calendar_event_id: event.id,
        event_title: event.title,
        event_start_at: event.start_at,
        channel: reminder.channel,
        minutes_before: reminder.minutes_before
      }
    )

    reminder.update!(state: 'sent', sent_at: Time.current)
  rescue StandardError
    reminder&.update(state: 'failed') if reminder&.pending?
    raise
  end
end
