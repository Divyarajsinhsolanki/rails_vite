# Bullet gem configuration for development N+1 query detection
# This helps identify performance issues during development

if defined?(Bullet)
  Bullet.enable = true
  Bullet.alert = false  # Don't show browser alerts (can be distracting)
  Bullet.console = true  # Log to console
  Bullet.rails_logger = true  # Log to Rails logger
  
  # Show stack trace for easier debugging
  Bullet.stacktrace_includes = ['app']
  
  # Only check for unused eager loading in development
  Bullet.unused_eager_loading_enable = false
end
