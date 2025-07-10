class Api::GreetingsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    render json: { message: 'Hello from Rails!' }
  end
end
