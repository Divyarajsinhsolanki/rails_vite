class Api::WorkLogsController < Api::BaseController
  before_action :set_work_log, only: [:update, :destroy]

  def index
    logs = current_user.work_logs.includes(:category, :priority, :tags)
    logs = logs.where(log_date: params[:date]) if params[:date].present?
    if params[:from].present? && params[:to].present?
      logs = logs.where(log_date: params[:from]..params[:to])
    end
    render json: logs.map { |log| serialize_log(log) }
  end

  def create
    log = current_user.work_logs.new(work_log_params)
    assign_tags(log)
    if log.save
      render json: serialize_log(log), status: :created
    else
      render json: { errors: log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    assign_tags(@work_log)
    if @work_log.update(work_log_params)
      render json: serialize_log(@work_log)
    else
      render json: { errors: @work_log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @work_log.destroy
    head :no_content
  end

  private

  def set_work_log
    @work_log = current_user.work_logs.find(params[:id])
  end

  def work_log_params
    params.require(:work_log).permit(:title, :description, :log_date, :start_time, :end_time, :category_id, :priority_id, :actual_minutes)
  end

  def assign_tags(log)
    names = params[:work_log][:tags] || []
    log.tags = names.map { |n| WorkTag.find_or_create_by(name: n) }
  end

  def serialize_log(log)
    log.as_json(include: {
      category: { only: [:id, :name, :color, :hex] },
      priority: { only: [:id, :name, :color, :hex] },
      tags: { only: [:id, :name] }
    })
  end
end
