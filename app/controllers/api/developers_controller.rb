class Api::DevelopersController < Api::BaseController
  def index
    @developers = Developer.order(:name)
    render json: @developers
  end
end