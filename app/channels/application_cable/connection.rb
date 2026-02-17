module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      jwt_cookie_user || warden_user || reject_unauthorized_connection
    end

    def jwt_cookie_user
      token = cookies.signed[:access_token]
      payload = JwtService.decode(token)
      User.find_by(id: payload["user_id"]) if payload
    rescue StandardError
      nil
    end

    def warden_user
      env["warden"]&.user
    end
  end
end
