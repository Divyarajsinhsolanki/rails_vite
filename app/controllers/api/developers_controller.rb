class Api::DevelopersController < Api::BaseController
  def index
    assignees = Assignee.order(:name)
    render json: assignees
  end
end
