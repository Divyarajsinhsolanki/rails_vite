class Api::DevelopersController < Api::BaseController
  def index
    users = User.order(:first_name, :last_name, :email)
    render json: users.map { |user| serialize_developer(user) }
  end

  private

  def serialize_developer(user)
    {
      id: user.id,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    }
  end
end
