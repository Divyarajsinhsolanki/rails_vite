class PostsController < ApplicationController
  before_action :authenticate_user!

  def index
    @recommended_users = User
                            .recommended_for(current_user, limit: 6)
                            .with_attached_profile_picture
  end
end
