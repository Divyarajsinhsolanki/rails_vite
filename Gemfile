source "https://rubygems.org"

ruby "3.3.0"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.4", ">= 8.0.4.1"

# Use sqlite3 as the database for Active Record
gem "sqlite3", "~> 1.4"

gem 'pg'

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 7.2", ">= 7.2.1"

# Bundle and transpile JavaScript [https://github.com/rails/jsbundling-rails]
gem "jsbundling-rails"

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
# gem "turbo-rails"

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails"

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder"
gem "rack-cors", ">= 2.0.2"
gem "rack-attack"
gem "kaminari"
gem "attr_encrypted", "~> 4.2"
gem "aws-sdk-s3", require: false
gem "sidekiq"
gem "sentry-rails"
gem "sentry-ruby"
gem "PdfMaster", path: "vendor/pdf_master"
gem "rubyzip", ">= 2.4", "< 4"

# connection_pool 3.0.x has a Ruby 3.3 syntax issue in this app stack.
gem "connection_pool", "~> 2.5"

# Use Redis adapter to run Action Cable in production
# gem "redis", ">= 4.0.1"

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
# gem "image_processing", "~> 1.2"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ]
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console"

  # Query performance monitoring - detect N+1 queries
  gem 'bullet'

  # Add speed badges [https://github.com/MiniProfiler/rack-mini-profiler]
  # gem "rack-mini-profiler"

  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem "capybara"
  gem "selenium-webdriver"
  gem "minitest", "~> 5.25"
end

group :development, :test do
  gem "brakeman", require: false
  gem "bundler-audit", require: false
end

gem "vite_rails", "~> 3.0"
gem "devise", ">= 5.0.4"
gem 'byebug'
gem "ruby-openai", "~> 5.0"
gem 'faraday', '>= 2.14.2'
gem 'jwt', '>= 2.10.3'
gem 'bcrypt', '>= 3.1.22'
gem "addressable", ">= 2.9.0"
gem "erb", ">= 6.0.4"
gem "json", ">= 2.19.2"
gem "loofah", ">= 2.25.1"
gem "net-imap", ">= 0.6.4"
gem "nokogiri", ">= 1.19.3"
gem "rack", ">= 3.2.6"
gem "rack-session", ">= 2.1.2"
gem 'rqrcode'
gem 'rss'
gem 'dotenv-rails', groups: [:development, :test]

# Access Google Sheets from Rails
gem 'google-api-client', '~> 0.53.0'
gem 'googleauth'
