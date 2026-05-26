Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",").map(&:strip)

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[Authorization],
      credentials: true
  end
end
