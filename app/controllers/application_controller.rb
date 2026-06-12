class ApplicationController < ActionController::Base
  include ActionController::Cookies

  before_action :set_current_user
  before_action :enforce_demo_read_only_request!
  after_action :reset_current_user

  private

  def set_current_user
    Current.user = current_user || user_from_access_cookie
    Current.workspace = Current.user&.workspace
  end

  def enforce_demo_read_only_request!
    return unless Current.user&.demo_account?
    return if request.get? || request.head? || request.options?
    return if demo_session_action?

    render json: { error: "demo_read_only" }, status: :forbidden
  end

  def demo_session_action?
    [
      ["POST", "/api/demo_session"],
      ["POST", "/api/login"],
      ["POST", "/api/refresh"],
      ["DELETE", "/api/logout"],
      ["POST", "/api/contacts"]
    ].include?([request.request_method, request.path])
  end

  def require_portfolio_enabled!
    head :not_found unless PortfolioAccess.enabled?
  end

  def user_from_access_cookie
    token = cookies.signed[:access_token]
    payload = JwtService.decode(token)
    User.find_by(id: payload["user_id"]) if payload
  rescue StandardError
    nil
  end

  def reset_current_user
    Current.reset_all
  end
end
