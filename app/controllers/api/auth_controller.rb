class Api::AuthController < ApplicationController
  include Rails.application.routes.url_helpers

  def signup
    user = User.new(user_params)
    if user.save
      render json: { message: "User created successfully", user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: user_params[:email])
    if user&.valid_password?(user_params[:password])
      token = user.generate_token_for(:auth)
      render json: { token: token, user: user }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def logout
    current_user.revoke_token_for(:auth)
    render json: { message: "Logged out successfully" }, status: :ok
  end

  def view_profile
    user = current_user
    profile_picture_url = rails_blob_url(user.profile_picture, only_path: true) if user.profile_picture.attached?
    render json: { user: user.as_json.merge(profile_picture: profile_picture_url) }
  end

  def update_profile
    current_user.update(user_params)
    render json: { message: "User details updated successfully" }, status: :ok
  end

  private

  def user_params
    params.require(:auth).permit(:first_name, :last_name, :date_of_birth, :email, :password, :profile_picture)
  end
end
