class Api::SprintsController < Api::BaseController
  around_action :log_project_dashboard_exceptions

  def index
    if params[:last].present?
      sprint = Sprint.order(created_at: :desc).first
      render json: sprint
    else
      sprints = Sprint.order(start_date: :asc)
      sprints = sprints.where(project_id: params[:project_id]) if params[:project_id].present?
      render json: sprints
    end
  end

  def last
    sprints = Sprint.all
    sprints = sprints.where(project_id: params[:project_id]) if params[:project_id].present?

    sprint = sprints.where("start_date <= ? AND end_date >= ?", Date.today, Date.today).first ||
             sprints.order(start_date: :desc).first

    render json: sprint
  end

  def create
    sprint = Sprint.new(sprint_params)
    if sprint.save
      render json: sprint
    else
      log_project_event(
        :error,
        'Sprint creation failed',
        payload: { project_id: sprint.project_id, sprint_name: sprint.name, errors: sprint.errors.full_messages }
      )
      render json: { errors: sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    sprint = Sprint.find(params[:id])
    if sprint.update(sprint_params)
      render json: sprint
    else
      log_project_event(
        :error,
        'Sprint update failed',
        payload: { project_id: sprint.project_id, sprint_id: sprint.id, sprint_name: sprint.name, errors: sprint.errors.full_messages }
      )
      render json: { errors: sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @sprint = Sprint.find(params[:id])
    if @sprint.destroy
      render json: { message: "Sprint deleted successfully", id: @sprint.id }
    else
      log_project_event(
        :error,
        'Sprint deletion failed',
        payload: { project_id: @sprint.project_id, sprint_id: @sprint.id, errors: @sprint.errors.full_messages }
      )
      render json: { errors: @sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def import_tasks
    sprint = Sprint.find(params[:id])
    log_sheet_event(
      :info,
      'Sprint task import started',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sprint.name, spreadsheet_id: sprint.project.sheet_id }
    )
    service = TaskSheetService.new(sprint.name, sprint.project.sheet_id)
    service.import_tasks(sprint_id: sprint.id, project_id: sprint.project_id, created_by_id: current_user.id)
    log_sheet_event(
      :info,
      'Sprint task import completed',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sprint.name, spreadsheet_id: sprint.project.sheet_id }
    )
    head :no_content
  rescue StandardError => e
    log_sheet_event(
      :error,
      'Sprint task import failed',
      exception: e,
      payload: { sprint_id: sprint&.id || params[:id], project_id: sprint&.project_id, sheet_name: sprint&.name, spreadsheet_id: sprint&.project&.sheet_id }
    )
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def export_tasks
    sprint = Sprint.find(params[:id])
    tasks = Task.where(sprint_id: sprint.id).order(:developer_id, :start_date)
    log_sheet_event(
      :info,
      'Sprint task export started',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sprint.name, spreadsheet_id: sprint.project.sheet_id, task_count: tasks.size }
    )
    service = TaskSheetService.new(sprint.name, sprint.project.sheet_id)
    service.export_tasks(tasks)
    log_sheet_event(
      :info,
      'Sprint task export completed',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sprint.name, spreadsheet_id: sprint.project.sheet_id, task_count: tasks.size }
    )
    head :no_content
  rescue StandardError => e
    log_sheet_event(
      :error,
      'Sprint task export failed',
      exception: e,
      payload: { sprint_id: sprint&.id || params[:id], project_id: sprint&.project_id, sheet_name: sprint&.name, spreadsheet_id: sprint&.project&.sheet_id }
    )
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def export_logs
    sprint = Sprint.find(params[:id])
    logs = TaskLog.joins(:task).where(tasks: { sprint_id: sprint.id }).includes(:task, :developer)
    sheet_name = "#{sprint.name} Scheduler"
    log_sheet_event(
      :info,
      'Sprint log export started',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sheet_name, spreadsheet_id: sprint.project.sheet_id, log_count: logs.size }
    )
    service = SchedulerSheetService.new(sheet_name, sprint.project.sheet_id)
    service.export_logs(logs)
    log_sheet_event(
      :info,
      'Sprint log export completed',
      payload: { project_id: sprint.project_id, sprint_id: sprint.id, sheet_name: sheet_name, spreadsheet_id: sprint.project.sheet_id, log_count: logs.size }
    )
    head :no_content
  rescue StandardError => e
    log_sheet_event(
      :error,
      'Sprint log export failed',
      exception: e,
      payload: { sprint_id: sprint&.id || params[:id], project_id: sprint&.project_id, sheet_name: sheet_name, spreadsheet_id: sprint&.project&.sheet_id }
    )
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private
  def sprint_params
    params.require(:sprint).permit(:name, :start_date, :end_date, :project_id, :working_days_mask)
  end
end
