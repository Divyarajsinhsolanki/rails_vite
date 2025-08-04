class ApplicationController < ActionController::Base
  include ActionController::Cookies

  before_action :set_current_user
  after_action :reset_current_user

  # No auth here — just base logic for UI controllers

  private

  def set_current_user
    Current.user = current_user
  end

  def reset_current_user
    Current.reset_all
  end
end
