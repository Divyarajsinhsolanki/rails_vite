class Api::BaseController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :authenticate_user!

  def authenticate_user!
    @current_user = jwt_cookie_user || devise_session_user
    Current.user = @current_user

    handle_unauthorized unless @current_user
  rescue StandardError
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

  def handle_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
