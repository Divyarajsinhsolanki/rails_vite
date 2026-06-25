require "test_helper"

class SignupWorkspaceTest < ActionDispatch::IntegrationTest
  test "public signup creates an isolated workspace and owner role" do
    assert_difference ["Workspace.count", "User.count"], 1 do
      post "/api/signup", params: {
        auth: {
          first_name: "New",
          last_name: "Owner",
          email: "new-owner@example.test",
          password: "Password!42",
          job_title: "Engineer"
        }
      }
    end

    assert_response :created
    user = User.find_by!(email: "new-owner@example.test")
    assert_equal "private", user.workspace.kind
    assert_equal "starter", user.workspace.plan_key
    assert_equal "trialing", user.workspace.billing_status
    assert user.owner?

    payload = JSON.parse(response.body)
    assert_equal "starter", payload.dig("user", "workspace", "saas", "plan", "key")
    assert_equal 5, payload.dig("user", "workspace", "saas", "limits", "seats")
  end
end
