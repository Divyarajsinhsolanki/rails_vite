class TopicFollowsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_topic

  def create
    current_user.topic_follows.find_or_create_by!(topic: @topic)
    respond_with_topic(:created)
  rescue ActiveRecord::RecordInvalid => e
    respond_to do |format|
      format.html do
        redirect_back fallback_location: posts_path,
                      alert: e.record.errors.full_messages.to_sentence
      end
      format.json do
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end
    end
  end

  def destroy
    follow = current_user.topic_follows.find_by(topic: @topic)
    follow&.destroy
    respond_with_topic(:ok)
  end

  private

  def set_topic
    @topic = Topic.find(params[:topic_id])
  end

  def respond_with_topic(status)
    respond_to do |format|
      format.html do
        redirect_back fallback_location: posts_path,
                      notice: status == :created ? "You are now following #{@topic.name}." : "You have unfollowed #{@topic.name}."
      end
      format.json do
        @topic.reload
        render json: {
          id: @topic.id,
          name: @topic.name,
          follows_count: @topic.follows_count,
          followed: current_user.following_topic?(@topic)
        }, status: status
      end
    end
  end
end
