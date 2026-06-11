dsn = ENV["SENTRY_DSN"].to_s

if dsn.present?
  Sentry.init do |config|
    config.dsn = dsn
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]
    config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", "0.05").to_f
    config.environment = Rails.env
    config.send_default_pii = false
  end
end
