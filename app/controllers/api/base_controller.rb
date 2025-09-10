class Api::BaseController < ApplicationController
  before_action :authenticate_user!

  private

  def authenticate_user!
    Current.user = current_user
    handle_unauthorized unless current_user
  end

  def handle_unauthorized
    respond_to do |format|
      format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
    end
  end
end
