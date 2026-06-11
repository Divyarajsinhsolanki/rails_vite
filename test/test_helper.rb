ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  parallelize(workers: 1)

  setup do
    Current.reset_all
    Role::NAMES.each { |name| Role.find_or_create_by!(name: name) }
  end

  teardown do
    Current.reset_all
  end
end
