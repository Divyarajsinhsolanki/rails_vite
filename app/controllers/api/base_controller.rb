class Api::BaseController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :set_request_context
  before_action :authenticate_user!

  def authenticate_user!
    @current_user = jwt_cookie_user || devise_session_user
    Current.user = @current_user

    return if @current_user

    log_application_warning('Unauthorized API access attempt')
    handle_unauthorized
  rescue StandardError => e
    AppEventLogger.error(
      :application_errors,
      source: "#{self.class.name}#authenticate_user!",
      message: 'Authentication failed',
      exception: e,
      payload: basic_request_context
    )
    handle_unauthorized
  end

  def current_user
    @current_user || devise_session_user
  end

  private

  def jwt_cookie_user
    token = cookies.signed[:access_token]
    payload = JwtService.decode(token)
    User.find_by(id: payload["user_id"]) if payload
  end

  def devise_session_user
    return nil unless defined?(super)

    super
  end

  def set_request_context
    Current.request_id = request.request_id
  end

  def basic_request_context(extra = {})
    {
      method: request.request_method,
      path: request.fullpath,
      project_id: params[:project_id],
      resource_id: params[:id]
    }.merge(extra).compact
  end

  def controller_action_source
    "#{self.class.name}##{action_name}"
  end

  def log_project_event(level, message, payload: {}, exception: nil)
    write_log(:project_dashboard, level, message, payload: payload, exception: exception)
  end

  def log_sheet_event(level, message, payload: {}, exception: nil)
    write_log(:sheet_operations, level, message, payload: payload, exception: exception)
  end

  def log_project_dashboard_exceptions
    yield
  rescue StandardError => e
    log_project_event(:error, 'Unhandled project dashboard error', exception: e)
    raise
  end

  def log_sheet_request_exceptions
    yield
  rescue StandardError => e
    log_sheet_event(:error, 'Unhandled sheet request error', exception: e)
    raise
  end

  def handle_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def log_application_warning(message, payload: {})
    AppEventLogger.warn(:application_errors, source: controller_action_source, message: message, payload: basic_request_context(payload))
  end

  def write_log(channel, level, message, payload:, exception: nil)
    full_payload = basic_request_context(payload)

    case level.to_sym
    when :info
      AppEventLogger.info(channel, source: controller_action_source, message: message, payload: full_payload)
    when :warn
      AppEventLogger.warn(channel, source: controller_action_source, message: message, payload: full_payload)
    else
      AppEventLogger.error(channel, source: controller_action_source, message: message, exception: exception, payload: full_payload)
    end
  end
end
