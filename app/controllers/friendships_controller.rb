class FriendshipsController < ApplicationController
  before_action :authenticate_user!

  def create
    friendship = current_user.active_friendships.find_or_initialize_by(friendship_params)

    if friendship.persisted? || friendship.save
      render json: { id: friendship.id }, status: :created
    else
      render json: { errors: friendship.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    friendship = current_user.active_friendships.find(params[:id])
    friendship.destroy

    head :no_content
  rescue ActiveRecord::RecordNotFound
    head :not_found
  end

  private

  def friendship_params
    params.require(:friendship).permit(:followed_id)
  end
end
