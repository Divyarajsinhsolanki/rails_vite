class Api::SprintsController < Api::BaseController

  def index
    if params[:last].present?
      sprint = Sprint.order(created_at: :desc).first
      render json: sprint
    else
      sprints = Sprint.order(created_at: :desc)
      sprints = sprints.where(project_id: params[:project_id]) if params[:project_id].present?
      render json: sprints
    end
  end

  def last
    sprint = Sprint.where("start_date <= ? AND end_date >= ?", Date.today, Date.today).first || Sprint.order(start_date: :desc).first
    render json: sprint
  end

  def create
    sprint = Sprint.new(sprint_params)
    if sprint.save
      render json: sprint
    else
      render json: { errors: sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    sprint = Sprint.find(params[:id])
    if sprint.update(sprint_params)
      render json: sprint
    else
      render json: { errors: sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @sprint = Sprint.find(params[:id])
    if @sprint.destroy
      render json: { message: "Sprint deleted successfully", id: @sprint.id }
    else
      render json: { errors: @sprint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def import_tasks
    sprint = Sprint.find(params[:id])
    service = TaskSheetService.new(sprint.name)
    service.import_tasks(sprint_id: sprint.id, created_by_id: current_user.id)
    head :no_content
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def export_tasks
    sprint = Sprint.find(params[:id])
    tasks = Task.where(sprint_id: sprint.id).order(:developer_id, :start_date)
    service = TaskSheetService.new(sprint.name)
    service.export_tasks(tasks)
    head :no_content
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def export_logs
    sprint = Sprint.find(params[:id])
    logs = TaskLog.joins(:task).where(tasks: { sprint_id: sprint.id }).includes(:task, :developer)
    sheet_name = "#{sprint.name} Scheduler"
    service = SchedulerSheetService.new(sheet_name)
    service.export_logs(logs)
    head :no_content
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private
  def sprint_params
    params.require(:sprint).permit(:name, :start_date, :end_date, :project_id)
  end
end
