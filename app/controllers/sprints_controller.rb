class SprintsController < ApplicationController
  def last
    sprint = Sprint.order(created_at: :desc).first
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

  private
  def sprint_params
    params.require(:sprint).permit(:name, :start_date, :end_date, :description)
  end
end
