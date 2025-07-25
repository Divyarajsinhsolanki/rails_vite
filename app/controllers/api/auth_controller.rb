require 'net/http'
require 'uri'

class Api::AuthController < Api::BaseController
  include Rails.application.routes.url_helpers
  skip_before_action :authenticate_user!, only: [:login, :signup, :refresh]

  def signup
    user = User.new(user_params)
    if params.dig(:auth, :profile_picture).present? && params.dig(:auth, :profile_picture) != "null"
      user.profile_picture = params[:auth][:profile_picture]
    end

    if user.save
      render json: { message: "User created successfully. Please check your email to verify your account.", user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = nil

    if params[:id_token] # firebase_token = request.headers["Authorization"]&.split(" ")&.last.presence
      payload = verify_firebase_token(params[:id_token])  # (firebase_token)
      return render json: { error: "Invalid token" }, status: :unauthorized unless payload

      user = User.find_or_create_by(email: payload["email"]) do |u|
        u.first_name = payload["name"]
        u.password = SecureRandom.hex(10)
        u.profile_picture.attach(
          io: URI.open(payload["picture"]),
          filename: "#{payload["email"]}_profile_picture.jpg",
          content_type: "image/jpeg"
        )
      end
    else
      user = User.find_by(email: params[:auth][:email])
      return render json: { error: "Invalid credentials" }, status: :unauthorized unless user&.valid_password?(params[:auth][:password])
      return render json: { error: "Email not verified" }, status: :unauthorized unless user.confirmed?
    end

    return render json: { error: "Account locked" }, status: :unauthorized if user.locked?

    set_jwt_cookie!(user)
    render json: {
      message: "Login successful",
      user: user.as_json(include: { roles: { only: [:name] } }),
      exp: 15.minutes.from_now.to_i
    }
  end

  def refresh
    refresh_token = cookies.signed[:refresh_token]
    payload = JwtService.decode(refresh_token)

    if payload && (user = User.find_by(id: payload["user_id"]))
      set_jwt_cookie!(user)
      render json: {
        user: user.as_json(include: { roles: { only: [:name] } }),
        exp: 15.minutes.from_now.to_i
      }
    else
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def logout
    cookies.delete(:access_token, httponly: true)
    cookies.delete(:refresh_token, httponly: true)
    render json: { message: "Logged out successfully" }
  end

  def view_profile
    profile_picture_url = rails_blob_url(current_user.profile_picture, only_path: true) if current_user&.profile_picture&.attached?
    teams = current_user.team_users.includes(:team).map do |tu|
      {
        id: tu.team_id,
        name: tu.team.name,
        role: tu.role,
        status: tu.status
      }
    end
    projects = current_user.project_users.includes(:project).map do |pu|
      {
        id: pu.project_id,
        name: pu.project.name,
        role: pu.role,
        status: pu.status
      }
    end
    render json: {
      user: current_user.as_json(include: { roles: { only: [:name] } })
                      .merge(profile_picture: profile_picture_url),
      teams: teams,
      projects: projects
    }
  end

  def update_profile
    current_user.update(user_params)
    if params.dig(:auth, :profile_picture).present? && params.dig(:auth, :profile_picture) != "null"
      current_user.profile_picture = params[:auth][:profile_picture]
    end
    render json: { message: "User details updated successfully" }
  end

  private

  def user_params
    permitted = params.require(:auth).permit(:first_name, :last_name, :date_of_birth, :email, :password, :uid, :profile_picture)
    permitted.delete(:profile_picture) if permitted[:profile_picture] == "null"
    permitted
  end

  def verify_firebase_token(token)
    certs = Rails.cache.fetch('google_certs', expires_in: 1.hour) do
      uri = URI('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
      JSON.parse(Net::HTTP.get(uri))
    end

    header = JWT.decode(token, nil, false).last
    key_data = certs[header['kid']]
    return nil unless key_data

    public_key = OpenSSL::X509::Certificate.new(key_data).public_key
    decoded, = JWT.decode(
      token,
      public_key,
      true,
      algorithm: 'RS256',
      iss: 'https://securetoken.google.com/temppdfmodifier',
      verify_iss: true,
      aud: 'temppdfmodifier',
      verify_aud: true
    )
    decoded
  rescue => e
    Rails.logger.error("Firebase token error: #{e}")
    nil
  end

  def set_jwt_cookie!(user)
    access_token = JwtService.encode({ user_id: user.id }, 15.minutes.from_now)
    refresh_token = JwtService.encode({ user_id: user.id }, 7.days.from_now)

    cookies.signed[:access_token] = {
      value: access_token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :strict,
      expires: 15.minutes.from_now
    }

    cookies.signed[:refresh_token] = {
      value: refresh_token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      expires: 7.days.from_now
    }
  end
end
