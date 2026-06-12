require "test_helper"

class UserKekaCredentialsTest < ActiveSupport::TestCase
  test "invalid encrypted Keka credentials do not break the profile payload" do
    workspace = Workspace.create!(name: "Keka Test", slug: "keka-test", kind: "private")
    user = workspace.users.create!(
      email: "keka@example.test",
      password: "Password!42",
      password_confirmation: "Password!42",
      first_name: "Keka",
      last_name: "User",
      job_title: "Engineer",
      status: "active",
      confirmed_at: Time.current,
      keka_base_url: "https://keka.example.test",
      keka_employee_id: "EMP-1"
    )
    user.update_columns(
      encrypted_keka_api_key: Base64.strict_encode64("invalid ciphertext"),
      encrypted_keka_api_key_iv: Base64.strict_encode64("invalid iv")
    )

    payload = user.reload.keka_payload

    assert_not payload[:connected]
    assert_nil payload[:api_key_masked]
    assert_equal "EMP-1", payload[:employee_id]
  end
end
