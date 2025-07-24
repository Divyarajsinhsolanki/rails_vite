class Api::UsersController < Api::BaseController
  include Rails.application.routes.url_helpers
  before_action :authorize_owner!
  before_action :set_user, only: [:update, :destroy, :update_profile]

  # GET /api/users.json
  def index
    @users = User.order(created_at: :desc)
    render json: @users.map { |user| serialize_user(user) }
  end

  # PATCH /api/users/:id.json
  def update
    if @user.update(user_params)
      render json: @user
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/users/:id.json
  def destroy
    @user.destroy
    head :no_content
  end

  # POST /api/update_profile
  def update_profile
    if @user.update(user_params)
      render json: @user
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:id] || params[:user][:id])
  end

  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :date_of_birth, :profile_picture)
  end

  def serialize_user(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: user.date_of_birth,
      profile_picture: user.profile_picture.attached? ?
        rails_blob_url(user.profile_picture, only_path: true) : nil
    }
  end

  def authorize_owner!
    head :forbidden unless current_user&.owner?
  end
end