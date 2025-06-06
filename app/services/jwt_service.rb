class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base
  EXPIRY = 15.minutes.from_now.to_i

  def self.encode(payload, exp = EXPIRY)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    decoded.with_indifferent_access
  rescue JWT::ExpiredSignature
    nil # Token expired
  rescue JWT::DecodeError
    nil # Invalid token
  end
end
