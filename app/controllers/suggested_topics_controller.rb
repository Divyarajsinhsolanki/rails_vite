class SuggestedTopicsController < ApplicationController
  before_action :authenticate_user!

  def index
    @suggested_topics = Topic.suggested_for(current_user, limit: limit_param)

    respond_to do |format|
      format.html do
        render partial: "posts/suggested_topics",
               locals: { topics: @suggested_topics },
               status: :ok
      end
      format.json do
        render json: @suggested_topics.map { |topic| serialize_topic(topic) }
      end
    end
  end

  private

  def limit_param
    params.fetch(:limit, 8).to_i.clamp(1, 24)
  end

  def serialize_topic(topic)
    {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      follows_count: topic.follows_count,
      followed: topic.followed_by?(current_user),
      follow_path: topic_follow_path(topic)
    }
  end
end
