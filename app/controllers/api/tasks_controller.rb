class Api::TasksController < Api::BaseController
  before_action :set_task, only: [:update, :destroy]

  # GET /tasks.json
  def index
    @tasks = Task.order(date: :asc)
    @tasks = @tasks.where(assigned_to: params[:assigned_to]) if params[:assigned_to].present?
    render json: @tasks
  end

  # POST /tasks.json
  def create
    @task = Task.new(task_params)
    if @task.save
      render json: @task, include: [:developer], status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/:id.json
  def update
    if @task.update(task_params)
      render json: @task, include: [:developer]
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/:id.json
  def destroy
    @task.destroy
    head :no_content
  end

  private

  def set_task
    @task = Task.find(params[:id])
  end

  def task_params
    params.require(:task).permit(
      :task_id, :task_url, :type, :title, :description,
      :status, :order, :assigned_to_user, :assigned_to_developer,
      :created_by, :created_at, :updated_by, :updated_at,
      :due_date, :date, :start_date, :end_date,
      :estimated_hours, :sprint_id, :developer_id, :is_struck
    )
  end
end
