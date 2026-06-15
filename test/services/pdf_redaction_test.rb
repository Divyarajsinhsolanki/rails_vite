require "test_helper"
require "open3"

class PdfRedactionTest < ActiveSupport::TestCase
  test "secure redaction removes underlying text from affected pages" do
    workspace = Workspace.create!(name: "Redaction", slug: "redaction", kind: "private")
    user = create_test_user(workspace:, email: "redaction@example.test")
    Current.user = user
    Current.workspace = workspace
    source = create_test_pdf(text: "SECRET-ACCOUNT-123", pages: 1)
    document = PdfDocuments::Manager.create_from_path!(
      user:,
      path: source.path,
      filename: "secret.pdf"
    )

    PdfDocuments::Processor.new(document:, user:).redact!(
      regions: [{ page_number: 1, x: 0, y: 0, width: 612, height: 792 }],
      base_version_id: document.current_version_id
    )

    document.reload.current_version.file.open do |file|
      text, = Open3.capture2("pdftotext", file.path, "-")
      assert_not_includes text, "SECRET-ACCOUNT-123"
    end
  ensure
    source&.close!
  end
end
