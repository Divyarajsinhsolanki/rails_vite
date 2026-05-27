# Enable Gzip compression for API responses
# This middleware compresses responses using gzip for significantly reduced bandwidth
# especially beneficial for large JSON responses

Rails.application.config.middleware.use Rack::Deflater, {
  # Only compress responses larger than 1KB to avoid overhead on small responses
  if: ->(env, status, headers, body) {
    content_length = headers['Content-Length']&.to_i || 0
    # Compress JSON and text responses and responses over 1KB
    content_length > 1024 && (
      headers['Content-Type']&.include?('application/json') ||
      headers['Content-Type']&.include?('text/')
    )
  }
}
