class Api::SprintsController < Api::BaseController

  def index
    if params[:last].present?
      sprint = Sprint.order(created_at: :desc).first
      render json: sprint
    else
      sprints = Sprint.order(created_at: :desc)
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

  private
  def sprint_params
    params.require(:sprint).permit(:name, :start_date, :end_date, :description)
  end
end
