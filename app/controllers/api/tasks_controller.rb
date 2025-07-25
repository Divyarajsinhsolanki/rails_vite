class Api::TasksController < Api::BaseController
  before_action :set_task, only: [:update, :destroy]

  # GET /tasks.json
  def index
    @tasks = Task.includes(:assigned_user)
                 .order(end_date: :asc)

    @tasks = @tasks.where(assigned_to_user: params[:assigned_to_user]) if params[:assigned_to_user].present?
    @tasks = @tasks.where(sprint_id: params[:sprint_id]) if params[:sprint_id].present?

    if params[:project_id].present?
      @tasks = @tasks.joins(:sprint).where(sprints: { project_id: params[:project_id] })
    end

    render json: @tasks.as_json(include: { assigned_user: { only: [:id, :first_name, :email] } })
  end

  # POST /tasks.json
  def create
    @task = Task.new(task_params)
    if @task.save
      render json: @task.as_json(include: { developer: {}, assigned_user: { only: [:id, :first_name, :email] } }), status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/:id.json
  def update
    old_sprint_id = @task.sprint_id
    old_dev_id    = @task.developer_id
    old_order     = @task.order

    if @task.update(task_params)
      reorder_group(old_sprint_id, old_dev_id) if old_sprint_id && old_dev_id &&
        (old_sprint_id != @task.sprint_id || old_dev_id != @task.developer_id || old_order != @task.order)
      reorder_group(@task.sprint_id, @task.developer_id)

      render json: @task.as_json(include: { developer: {}, assigned_user: { only: [:id, :first_name, :email] } })
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/:id.json
  def destroy
    @task.destroy
    head :no_content
  end

  def import_backlog
    service = TaskSheetService.new('Backlog')
    service.import_tasks(sprint_id: nil, created_by_id: current_user.id)
    head :no_content
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def set_task
    @task = Task.find(params[:id])
  end

  def task_params
    task_data = params.require(:task)
    task_data = task_data[:task] if task_data[:task].is_a?(ActionController::Parameters)
    task_data.permit(
      :task_id, :task_url, :type, :title, :description,
      :status, :order, :assigned_to_user,
      :created_by, :created_at, :updated_by, :updated_at,
      :start_date, :end_date,
      :estimated_hours, :sprint_id, :developer_id, :is_struck
    )
  end

  def reorder_group(sprint_id, developer_id)
    Task.transaction do
      tasks = Task.where(sprint_id: sprint_id, developer_id: developer_id)
                   .order(:order, :id)
                   .lock

      tasks.each_with_index do |t, idx|
        new_order = idx + 1
        t.update_column(:order, new_order) if t.order != new_order
      end
    end
  end
end
