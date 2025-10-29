class KnowledgeBookmarkReminderJob < ApplicationJob
  queue_as :default

  def perform
    KnowledgeBookmark.due_for_reminder.includes(:user).find_each do |bookmark|
      next if bookmark.user.email.blank?

      KnowledgeBookmarkMailer.reminder(bookmark).deliver_later
      bookmark.schedule_next_reminder!
    end
  end
end
