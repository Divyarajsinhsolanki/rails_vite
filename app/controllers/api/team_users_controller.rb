class Api::TeamUsersController < Api::BaseController
  before_action :authorize_admin!
  before_action :set_team_user, only: [:update, :destroy]

  def create
    team_user = TeamUser.new(team_user_params)
    if team_user.save
      render json: serialize_team_user(team_user), status: :created
    else
      render json: { errors: team_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @team_user.update(team_user_params)
      render json: serialize_team_user(@team_user)
    else
      render json: { errors: @team_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @team_user.destroy
    head :no_content
  end

  private

  def authorize_admin!
    head :forbidden unless current_user&.admin?
  end

  def set_team_user
    @team_user = TeamUser.find(params[:id])
  end

  def team_user_params
    params.require(:team_user).permit(:team_id, :user_id, :role, :status)
  end

  def serialize_team_user(tu)
    {
      id: tu.id,
      team_id: tu.team_id,
      user_id: tu.user_id,
      role: tu.role,
      status: tu.status
    }
  end
end
