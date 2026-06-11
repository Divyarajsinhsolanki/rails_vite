module SessionCookieAuthentication
  extend ActiveSupport::Concern

  private

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

  def clear_jwt_cookies!
    cookies.delete(:access_token, httponly: true)
    cookies.delete(:refresh_token, httponly: true)
  end

  def authentication_user_payload(user)
    profile_picture_url = rails_blob_url(user.profile_picture, only_path: true) if user.profile_picture.attached?
    cover_photo_url = rails_blob_url(user.cover_photo, only_path: true) if user.cover_photo.attached?

    user.public_json(include_roles: true).symbolize_keys.merge(
      profile_picture: profile_picture_url,
      cover_photo: cover_photo_url,
      avatar_color: user.avatar_color,
      landing_page: user.demo_account? ? "demo" : user.landing_page,
      phone_number: user.phone_number,
      bio: user.bio,
      social_links: user.social_links || {},
      demo_account: user.demo_account?,
      site_admin: user.site_admin?,
      workspace: {
        id: user.workspace_id,
        name: user.workspace.name,
        slug: user.workspace.slug,
        kind: user.workspace.kind
      }
    )
  end
end
