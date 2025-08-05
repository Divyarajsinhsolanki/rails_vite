class Api::WorkPrioritiesController < Api::BaseController
  before_action :set_priority, only: [:update, :destroy]

  def index
    render json: WorkPriority.all
  end

  def create
    priority = WorkPriority.new(priority_params)
    if priority.save
      render json: priority, status: :created
    else
      render json: { errors: priority.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @priority.update(priority_params)
      render json: @priority
    else
      render json: { errors: @priority.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @priority.destroy
    head :no_content
  end

  private

  def set_priority
    @priority = WorkPriority.find(params[:id])
  end

  def priority_params
    params.require(:work_priority).permit(:name, :color, :hex)
  end
end
