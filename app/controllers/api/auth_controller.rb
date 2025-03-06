class Api::AuthController < ApplicationController
  before_action :authenticate_user!, only: [:logout]

  # User Signup
  def signup
    user = User.new(user_params)
    if user.save
      render json: { message: "User created successfully", user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # User Login
  def login
    user = User.find_by(email: user_params[:email])
    if user && user.valid_password?(user_params[:password])
      token = user.jwt_token
      render json: { token: token, user: user }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  # User Logout
  def logout
    current_user.update(jti: nil) # Invalidate JWT
    render json: { message: "Logged out successfully" }, status: :ok
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end
