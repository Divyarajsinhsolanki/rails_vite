class Api::IssuesController < Api::BaseController
  include Rails.application.routes.url_helpers
  before_action :require_project_id!, only: [:create, :update, :destroy]
  before_action :set_issue, only: [:update, :destroy]

  def index
    return render json: { error: "project_id required" }, status: :unprocessable_entity unless params[:project_id].present?

    issues = Issue.where(project_id: params[:project_id]).order(created_at: :desc)
    render json: issues.map { |i| serialize_issue(i) }
  end

  def create
    issue = Issue.new(issue_params.merge(project_id: @project_id))
    attach_media(issue)
    if issue.save
      render json: serialize_issue(issue), status: :created
    else
      render json: { errors: issue.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    attach_media(@issue)
    if @issue.update(issue_params.merge(project_id: @project_id))
      render json: serialize_issue(@issue)
    else
      render json: { errors: @issue.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @issue.destroy
    head :no_content
  end

  private

  def set_issue
    @issue = Issue.find_by!(id: params[:id], project_id: @project_id)
  end

  def issue_params
    params.require(:issue).permit(
      :project_id, :issue_key, :title, :status, :severity, :category, :module_name,
      :sub_module, :sprint_name, :task_id, :found_by, :found_on, :issue_description,
      :pre_conditions, :repro_steps, :actual_result, :expected_result, :attachment, :comment,
      :owner, :owner_email, :assignee, :assignee_email, :assignee_slack, :due_date,
      media_urls: [], attachment_urls: []
    )
  end

  def require_project_id!
    @project_id = params[:project_id] || params.dig(:issue, :project_id)
    unless @project_id.present?
      render json: { error: "project_id required" }, status: :unprocessable_entity
    end
  end

  def attach_media(issue)
    files = params.dig(:issue, :media_files)
    return unless files.present?
    Array(files).each do |file|
      issue.media_files.attach(file)
    end
  end

  def serialize_issue(issue)
    media_urls = issue.media_files.map { |f| url_for(f) }
    issue.as_json.merge(
      media_files: media_urls,
      media_urls: issue.media_urls || [],
      attachment_urls: issue.attachment_urls || []
    )
  end
end
