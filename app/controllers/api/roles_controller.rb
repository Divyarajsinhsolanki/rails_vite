class Api::RolesController < Api::BaseController
  before_action :authorize_role_access!

  def index
    render json: available_role_names
  end

  private

  def available_role_names
    names = Role.order(:name).pluck(:name)
    return names if current_user&.owner?

    names - ['owner']
  end

  def authorize_role_access!
    head :forbidden unless current_user&.owner? || current_user&.admin?
  end
end
