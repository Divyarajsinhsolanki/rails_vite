class Api::CalendarEventsController < Api::BaseController
  before_action :set_calendar_event, only: [:update, :destroy]

  def index
    events = scoped_events.includes(:event_reminders).order(:start_at)

    if params[:start].present? && params[:end].present?
      begin
        start_time = Time.zone.parse(params[:start])
        end_time = Time.zone.parse(params[:end])
        events = events.within_range(start_time, end_time) if start_time.present? && end_time.present?
      rescue ArgumentError
        return render json: { error: 'Invalid start or end datetime filter' }, status: :unprocessable_entity
      end
    end

    events = events.where(project_id: params[:project_id]) if params[:project_id].present?
    events = events.where(visibility: params[:visibility]) if params[:visibility].present?

    render json: events.map(&:as_api_json)
  end

  def create
    event = current_user.calendar_events.new(calendar_event_params)

    if event.save
      render json: event.as_api_json, status: :created
    else
      render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @calendar_event.update(calendar_event_params)
      render json: @calendar_event.as_api_json
    else
      render json: { errors: @calendar_event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @calendar_event.destroy
    head :no_content
  end

  private

  def set_calendar_event
    @calendar_event = scoped_events.find(params[:id])
  end

  def scoped_events
    project_ids = current_user.projects.select(:id)

    CalendarEvent.where(user_id: current_user.id)
                 .or(CalendarEvent.where(visibility: 'project', project_id: project_ids))
                 .distinct
  end

  def calendar_event_params
    params.require(:calendar_event).permit(
      :title,
      :description,
      :start_at,
      :end_at,
      :all_day,
      :event_type,
      :visibility,
      :status,
      :project_id,
      :task_id,
      :sprint_id,
      :location_or_meet_link
    )
  end
end
