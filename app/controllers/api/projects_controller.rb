class Api::ProjectsController < Api::BaseController
  include Rails.application.routes.url_helpers
  before_action :set_project, only: [:update, :destroy]
  before_action :authorize_manager!, only: [:create, :update, :destroy]

  def index
    projects = Project.includes(project_users: :user).order(:name)
    render json: projects.map { |p| serialize_project(p) }
  end

  def create
    project = Project.new(project_params)
    project.owner ||= current_user
    if project.save
      render json: serialize_project(project), status: :created
    else
      render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @project.update(project_params)
      render json: serialize_project(@project)
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    head :no_content
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(
      :name,
      :description,
      :start_date,
      :end_date,
      :sheet_integration_enabled,
      :sheet_id
    )
  end

  def authorize_manager!
    allowed = current_user&.owner? || current_user&.project_manager?
    head :forbidden unless allowed
  end

  def serialize_project(project)
    {
      id: project.id,
      name: project.name,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      sheet_integration_enabled: project.sheet_integration_enabled,
      sheet_id: project.sheet_id,
      users: project.project_users.map do |pu|
        {
          id: pu.user_id,
          project_user_id: pu.id,
          name: [pu.user.first_name, pu.user.last_name].compact.join(' '),
          profile_picture: pu.user.profile_picture.attached? ?
            rails_blob_url(pu.user.profile_picture, only_path: true) : nil,
          role: pu.role,
          status: pu.status,
          allocation_percentage: pu.allocation_percentage,
          workload_status: pu.workload_status
        }
      end
    }
  end
end
