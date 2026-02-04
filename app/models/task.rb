class Task < ApplicationRecord
  include UserStampable

  belongs_to :sprint, optional: true, inverse_of: :tasks
  belongs_to :developer, optional: true, inverse_of: :tasks
  belongs_to :project, optional: true, inverse_of: :tasks
  belongs_to :assigned_user, class_name: 'User', foreign_key: :assigned_to_user, optional: true, inverse_of: :tasks

  has_many :task_logs, dependent: :destroy, inverse_of: :task

  # This tells ActiveRecord NOT to use the 'type' column for Single Table Inheritance.
  self.inheritance_column = 'non_existent_type_column'

  validates :task_id, presence: true, unless: :general?
  validates :developer, presence: true, unless: :general?
  validates :type, presence: true
  validates :title, presence: true, if: :general?

  after_create :notify_assigned_user
  after_update :notify_assigned_user_change

  private

  def general?
    type == 'general' || type == 'qa'
  end

  def notify_assigned_user
    return unless assigned_user

    actor_id = notification_actor_id(created_by)
    return unless actor_id

    Notification.create(
      recipient: assigned_user,
      actor_id: actor_id,
      action: 'assigned',
      notifiable: self,
      metadata: { task_title: title || "Task #{task_id}" }
    )
  end

  def notify_assigned_user_change
    return unless saved_change_to_assigned_to_user? && assigned_user

    actor_id = notification_actor_id(updated_by)
    return unless actor_id

    Notification.create(
      recipient: assigned_user,
      actor_id: actor_id,
      action: 'assigned',
      notifiable: self,
      metadata: { task_title: title || "Task #{task_id}" }
    )
  end

  def notification_actor_id(default_id)
    default_id || Current.user&.id || created_by
  end
end
