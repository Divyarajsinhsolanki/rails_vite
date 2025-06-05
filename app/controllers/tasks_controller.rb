class TasksController < ApplicationController
  before_action :set_task, only: [:update, :destroy]

  # GET /tasks.json
  def index
    @tasks = Task.order(date: :asc).all
    render json: @tasks, include: [:developer]
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
      :task_id,
      :task_url,
      :type,
      :estimated_hours,
      :date,
      :sprint_id,
      :developer_id,
      :is_struck
    )
  end
end
