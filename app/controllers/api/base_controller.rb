class Api::BaseController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :authenticate_user!

  attr_reader :current_user

  def authenticate_user!
    token = cookies.signed[:access_token]
    payload = JwtService.decode(token)

    @current_user = User.find_by(id: payload["user_id"]) if payload
    Current.user = @current_user

    handle_unauthorized unless @current_user
  rescue
    handle_unauthorized
  end

  private

  def handle_unauthorized
    respond_to do |format|
      format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
    end
  end
end
