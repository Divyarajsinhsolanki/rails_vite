class Api::UsersController < Api::BaseController
  before_action :set_user, only: [:update, :destroy, :update_profile]

  # GET /api/users.json
  def index
    @users = User.order(created_at: :desc)
    render json: @users
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
    params.require(:user).permit(:first_name, :last_name, :email, :date_of_birth)
  end
end