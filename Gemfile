source "https://rubygems.org"

ruby "3.3.0"

# Rails framework
gem "rails", "~> 8.0.4", ">= 8.0.4.1"

# Database adapters
gem "pg"
gem "sqlite3", "~> 1.4"

# Web server and boot performance
gem "bootsnap", require: false
gem "puma", "~> 7.2", ">= 7.2.1"

# Frontend and Rails UI integration
gem "jbuilder"
gem "jsbundling-rails"
gem "stimulus-rails"
gem "vite_rails", "~> 3.0"

# Authentication, authorization, and API protection
gem "bcrypt", ">= 3.1.22"
gem "devise", ">= 5.0.4"
gem "jwt", ">= 2.10.3"
gem "rack-attack"
gem "rack-cors", ">= 2.0.2"

# Application services
gem "attr_encrypted", "~> 4.2"
gem "connection_pool", "~> 2.5"
gem "faraday", ">= 2.14.2"
gem "kaminari"
gem "ruby-openai", "~> 5.0"
gem "sidekiq"

# Storage, observability, and external services
gem "aws-sdk-s3", require: false
gem "sentry-rails"
gem "sentry-ruby"

# PDF and document processing
gem "PdfMaster", path: "vendor/pdf_master"
gem "rqrcode"
gem "rss"
gem "rubyzip", ">= 2.4", "< 4"

# Google integrations
gem "google-api-client", "~> 0.53.0"
gem "googleauth"

# Security and compatibility pins
gem "addressable", ">= 2.9.0"
gem "erb", ">= 6.0.4"
gem "json", ">= 2.19.2"
gem "loofah", ">= 2.25.1"
gem "net-imap", ">= 0.6.4"
gem "nokogiri", ">= 1.19.3"
gem "rack", ">= 3.2.6"
gem "rack-session", ">= 2.1.2"

# Windows/JRuby timezone support
gem "tzinfo-data", platforms: %i[windows jruby]

group :development do
  gem "bullet"
  gem "web-console"
end

group :development, :test do
  gem "brakeman", require: false
  gem "bundler-audit", require: false
  gem "byebug"
  gem "debug", platforms: %i[mri windows]
  gem "dotenv-rails"
end

group :test do
  gem "capybara"
  gem "minitest", "~> 5.25"
  gem "selenium-webdriver"
end
