class Api::AdminSessionsController < Api::BaseController
  include Rails.application.routes.url_helpers

  def create
    return head :forbidden unless current_user&.owner? || current_user&.admin?

    user = User.find_by(id: params[:user_id])
    return render json: { error: 'User not found' }, status: :not_found unless user

    return render json: { error: 'Account locked' }, status: :unprocessable_entity if user.locked?

    set_jwt_cookie!(user)
    render json: {
      message: 'Impersonation login successful',
      user: user_payload(user),
      exp: 15.minutes.from_now.to_i
    }
  end

  private

  def user_payload(user)
    profile_picture_url = rails_blob_url(user.profile_picture, only_path: true) if user.profile_picture.attached?
    cover_photo_url = rails_blob_url(user.cover_photo, only_path: true) if user.cover_photo.attached?

    user.as_json(include: { roles: { only: [:name] } }).merge(
      profile_picture: profile_picture_url,
      cover_photo: cover_photo_url,
      landing_page: user.landing_page,
      phone_number: user.phone_number,
      bio: user.bio,
      social_links: user.social_links || {}
    )
  end

  def set_jwt_cookie!(user)
    access_token = JwtService.encode({ user_id: user.id }, exp: 15.minutes.from_now)
    refresh_token = JwtService.encode({ user_id: user.id }, exp: 7.days.from_now)

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
