class Api::AuthController < ApplicationController
  include Rails.application.routes.url_helpers

  def signup
    user = User.new(user_params)
    params[:profile_picture] && (user.profile_picture = params[:profile_picture])
    if user.save
      render json: { message: "User created successfully", user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    token = request.headers["Authorization"]&.split(" ")&.last
    if token.present? && token != "undefined"
      payload = verify_firebase_token(token)
      puts "Decoded Payload: #{payload.inspect}"

      return render json: { error: "Invalid token" }, status: :unauthorized unless payload

      user = User.find_or_create_by(email: payload["email"]) do |u|
        u.first_name = payload["name"]
        # u.profile_picture = payload["picture"] # Temporary commented
        u.password = SecureRandom.hex(10) # Dummy password for Google users
      end
    else
      user = User.find_by(email: params[:email])
      return render json: { error: "Invalid email or password" }, status: :unauthorized unless user&.valid_password?(params[:password])
    end

    token = user.generate_token_for(:auth)
    render json: { token: token, user: user }, status: :ok
  end

  def logout
    current_user&.revoke_token_for(:auth)
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
    params.require(:auth).permit(:first_name, :last_name, :date_of_birth, :email, :password, :uid)
  end

  def verify_firebase_token(token)
    FirebaseIdToken::Certificates.request
    FirebaseIdToken::Signature.verify(token)
  rescue StandardError => e
    puts("Firebase token verification failed: #{e.message}")
    nil
  end
end
