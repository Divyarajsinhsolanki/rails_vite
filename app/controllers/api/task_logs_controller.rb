class Api::TaskLogsController < Api::BaseController
  before_action :set_task_log, only: [:update, :destroy]

  def index
    task_logs = TaskLog.includes(:task, :developer).order(log_date: :asc)
    task_logs = task_logs.where(task_id: params[:task_id]) if params[:task_id].present?
    task_logs = task_logs.where(developer_id: params[:developer_id]) if params[:developer_id].present?
    task_logs = task_logs.where(log_date: params[:log_date]) if params[:log_date].present?

    task_logs = task_logs.joins(:task) if params[:type].present? || params[:sprint_id].present? || params[:project_id].present?
    task_logs = task_logs.joins(task: :sprint) if params[:sprint_id].present? || params[:project_id].present?
    task_logs = task_logs.where(tasks: { sprint_id: params[:sprint_id] }) if params[:sprint_id].present?
    task_logs = task_logs.where(sprints: { project_id: params[:project_id] }) if params[:project_id].present?
    task_logs = task_logs.where(tasks: { type: params[:type] }) if params[:type].present?

    render json: task_logs.as_json(include: { task: {}, developer: {} })
  end

  def create
    task_log = TaskLog.new(task_log_params)
    if task_log.save
      render json: task_log.as_json(include: { task: {}, developer: {} }), status: :created
    else
      render json: { errors: task_log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @task_log.update(task_log_params)
      render json: @task_log.as_json(include: { task: {}, developer: {} })
    else
      render json: { errors: @task_log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @task_log.destroy
    head :no_content
  end

  private

  def set_task_log
    @task_log = TaskLog.find(params[:id])
  end

  def task_log_params
    params.require(:task_log).permit(:task_id, :developer_id, :log_date, :type, :hours_logged, :status, :created_by, :updated_by)
  end
end
