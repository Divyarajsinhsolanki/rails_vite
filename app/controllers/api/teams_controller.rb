class Api::TeamsController < Api::BaseController
  include Rails.application.routes.url_helpers
  before_action :set_team, only: [:update, :destroy]
  before_action :authorize_leader!, only: [:create, :update, :destroy]

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

  def authorize_leader!
    allowed = current_user&.owner? || current_user&.team_leader?
    head :forbidden unless allowed
  end

  def serialize_team(team)
    {
      id: team.id,
      name: team.name,
      description: team.description,
      users: team.team_users.map do |tu|
        {
          id: tu.user_id,
          team_user_id: tu.id,
          name: [tu.user.first_name, tu.user.last_name].compact.join(' '),
          email: tu.user.email,
          profile_picture: tu.user.profile_picture.attached? ?
            rails_blob_url(tu.user.profile_picture, only_path: true) : nil,
          role: tu.role,
          status: tu.status
        }
      end
    }
  end
end
