class Api::TeamsController < Api::BaseController
  before_action :set_team, only: [:update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  def index
    teams = Team.includes(team_users: :user).order(:name)
    render json: teams.map { |t| serialize_team(t) }
  end

  def create
    team = Team.new(team_params)
    team.owner ||= current_user
    if team.save
      render json: serialize_team(team), status: :created
    else
      render json: { errors: team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @team.update(team_params)
      render json: serialize_team(@team)
    else
      render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @team.destroy
    head :no_content
  end

  private

  def set_team
    @team = Team.find(params[:id])
  end

  def team_params
    params.require(:team).permit(:name, :description)
  end

  def authorize_admin!
    unless current_user&.owner? || current_user&.admin?
      head :forbidden
    end
  end

  def serialize_team(team)
    {
      id: team.id,
      name: team.name,
      description: team.description,
      users: team.team_users.map do |tu|
        {
          id: tu.user_id,
          name: [tu.user.first_name, tu.user.last_name].compact.join(' '),
          role: tu.role
        }
      end
    }
  end
end
