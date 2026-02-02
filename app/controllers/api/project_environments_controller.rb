class Api::ProjectEnvironmentsController < Api::BaseController
  before_action :set_project
  before_action :set_environment, only: [:update, :destroy]
  before_action :authorize_project_member

  def index
    environments = @project.project_environments.order(:name)
    render json: environments
  end

  def create
    environment = @project.project_environments.build(environment_params)
    if environment.save
      render json: environment, status: :created
    else
      render json: { errors: environment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @environment.update(environment_params)
      render json: @environment
    else
      render json: { errors: @environment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @environment.destroy
    head :no_content
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_environment
    @environment = @project.project_environments.find(params[:id])
  end

  def authorize_project_member
    unless @project.users.include?(current_user)
      render json: { error: 'Not authorized' }, status: :forbidden
    end
  end

  def environment_params
    params.require(:project_environment).permit(:name, :url, :description)
  end
end
