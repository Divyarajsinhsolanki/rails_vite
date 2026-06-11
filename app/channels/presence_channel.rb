class PresenceChannel < ApplicationCable::Channel
  def subscribed
    stream_from "workspace_#{current_workspace.id}:presence"
  end
end
