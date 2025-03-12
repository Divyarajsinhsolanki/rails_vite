class ApplicationController < ActionController::Base
  before_action :authenticate_user!

  # def authenticate_user!
  #   excluded_paths = ["login", "signup"]
  #   return if excluded_paths.include?(params[:path])

  #   header = request.headers["Authorization"]
  #   token = header.split(" ").last if header

  #   begin
  #     decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
  #     @current_user = User.find(decoded["user_id"])
  #   rescue
  #     redirect_to "/signup"
  #   end
  # end

  def authenticate_user!
    excluded_paths = ["login", "signup"]
    return if excluded_paths.include?(params[:path])

    token = request.headers["Authorization"]&.split(" ")&.last
    @current_user = User.find_by_token_for(:auth, token) if token
    # render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end
end
