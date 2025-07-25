class Api::RolesController < Api::BaseController
  before_action :authorize_owner!

  def index
    render json: Role.order(:name).pluck(:name)
  end

  private

  def authorize_owner!
    head :forbidden unless current_user&.owner?
  end
end
