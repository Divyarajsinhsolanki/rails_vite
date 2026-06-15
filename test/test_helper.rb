ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "prawn"
require "tempfile"

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

module PdfTestHelper
  def create_test_pdf(text: "PDF test document", pages: 2)
    file = Tempfile.new(["pdf-test-", ".pdf"])
    Prawn::Document.generate(file.path) do |pdf|
      pages.times do |index|
        pdf.start_new_page unless index.zero?
        pdf.text("#{text} page #{index + 1}")
      end
    end
    file
  end

  def create_test_user(workspace:, email:)
    workspace.users.create!(
      email:,
      password: "Password!42",
      password_confirmation: "Password!42",
      first_name: "PDF",
      last_name: "Tester",
      job_title: "Engineer",
      status: "active",
      confirmed_at: Time.current
    )
  end
end

ActiveSupport::TestCase.include(PdfTestHelper)
