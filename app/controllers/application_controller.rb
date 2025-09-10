class ApplicationController < ActionController::Base
  include ActionController::Cookies

  before_action :set_current_user
  after_action :reset_current_user

  # No auth here — just base logic for UI controllers

  private

  def current_user
    @current_user ||= User.find_by(id: 5)
  end

  def set_current_user
    if (user = current_user)
      sign_in(user)
      Current.user = user
    end
  end

  def reset_current_user
    Current.reset_all
  end
end
