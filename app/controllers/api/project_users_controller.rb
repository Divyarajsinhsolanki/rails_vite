class Api::ProjectUsersController < Api::BaseController
  before_action :authorize_admin!, except: [:leave]
  before_action :authorize_manager!, only: [:leave]
  before_action :set_project_user, only: [:update, :destroy]

  def create
    project_user = ProjectUser.new(project_user_params)
    if project_user.save
      render json: serialize_project_user(project_user), status: :created
    else
      render json: { errors: project_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @project_user.update(project_user_params)
      render json: serialize_project_user(@project_user)
    else
      render json: { errors: @project_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @project_user.destroy
    head :no_content
  end

  def leave
    project_user = ProjectUser.find_by(project_id: params[:project_id], user_id: current_user.id)
    return head :not_found unless project_user

    project_user.destroy
    head :no_content
  end

  private

  def authorize_admin!
    head :forbidden unless current_user&.admin?
  end

  def authorize_manager!
    head :forbidden unless current_user&.project_manager?
  end

  def set_project_user
    @project_user = ProjectUser.find(params[:id])
  end

  def project_user_params
    params.require(:project_user).permit(:project_id, :user_id, :role, :status)
  end

  def serialize_project_user(pu)
    {
      id: pu.id,
      project_id: pu.project_id,
      user_id: pu.user_id,
      role: pu.role,
      status: pu.status
    }
  end
end
