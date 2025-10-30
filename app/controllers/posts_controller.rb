class PostsController < ApplicationController
  before_action :authenticate_user!

  def index
    @posts = Post.includes(:user).order(created_at: :desc).limit(20)
    @suggested_topics = Topic.suggested_for(current_user, limit: 8)
  end
end
