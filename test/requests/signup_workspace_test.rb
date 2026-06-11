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
    assert user.owner?
  end
end
