class Api::NotificationsController < ApplicationController
  before_action :authenticate_user!

  def index
    notifications = current_user.notifications.recent.page(params[:page]).per(20)
    
    render json: {
      notifications: notifications.map do |n| 
        {
          id: n.id,
          actor: n.actor.full_name,
          actor_avatar: n.actor.profile_picture.attached? ? url_for(n.actor.profile_picture) : nil,
          action: n.action,
          notifiable_type: n.notifiable_type,
          notifiable_id: n.notifiable_id,
          read_at: n.read_at,
          created_at: n.created_at,
          metadata: n.metadata,
          message: generate_message(n)
        }
      end,
      meta: {
        total_pages: notifications.total_pages,
        current_page: notifications.current_page,
        unread_count: current_user.notifications.unread.count
      }
    }
  end

  def mark_read
    notification = current_user.notifications.find(params[:id])
    notification.mark_as_read!
    render json: { success: true }
  end

  def mark_all_read
    current_user.notifications.unread.update_all(read_at: Time.current)
    render json: { success: true }
  end

  private

  def generate_message(notification)
    case notification.action
    when 'assigned'
      "#{notification.actor.full_name} assigned you a task"
    when 'commented'
      "#{notification.actor.full_name} commented on your post"
    when 'update'
      "#{notification.actor.full_name} updated a task"
    else
      "New notification"
    end
  end
end
