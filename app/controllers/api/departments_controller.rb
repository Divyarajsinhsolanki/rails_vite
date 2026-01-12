class Api::DepartmentsController < Api::BaseController
  def index
    render json: Department.order(:name).select(:id, :name)
  end
end
