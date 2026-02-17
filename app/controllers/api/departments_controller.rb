class Api::DepartmentsController < Api::BaseController
  before_action :set_department, only: [:show, :update, :destroy, :members, :update_members]
  before_action :authorize_admin!, only: [:create, :update, :destroy, :update_members]

  def index
    departments = Department.includes(:users).order(:name)

    render json: departments.map { |department| serialize_department(department) }
  end

  def show
    render json: serialize_department(@department, include_members: true)
  end

  def create
    department = Department.new(department_params)

    if department.save
      render json: serialize_department(department), status: :created
    else
      render json: { errors: department.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @department.update(department_params)
      render json: serialize_department(@department)
    else
      render json: { errors: @department.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @department.destroy
    head :no_content
  end

  def members
    render json: {
      department: serialize_department(@department),
      users: serialized_users(@department.users.order(:first_name, :last_name, :email))
    }
  end

  def update_members
    user_ids = Array(params[:user_ids]).map(&:to_i).uniq

    User.transaction do
      @department.users.update_all(department_id: nil)
      User.where(id: user_ids).update_all(department_id: @department.id)
    end

    @department.reload

    render json: {
      department: serialize_department(@department),
      users: serialized_users(@department.users.order(:first_name, :last_name, :email)),
      message: "Department members updated successfully."
    }
  end

  private

  def set_department
    @department = Department.find(params[:id])
  end

  def department_params
    params.require(:department).permit(:name)
  end

  def serialize_department(department, include_members: false)
    payload = {
      id: department.id,
      name: department.name,
      users_count: department.users.size,
      updated_at: department.updated_at
    }

    payload[:members] = serialized_users(department.users.order(:first_name, :last_name, :email)) if include_members
    payload
  end

  def serialized_users(users)
    users.map do |user|
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        job_title: user.job_title,
        department_id: user.department_id,
        full_name: user.full_name
      }
    end
  end

  def authorize_admin!
    head :forbidden unless current_user&.admin? || current_user&.owner?
  end
end
