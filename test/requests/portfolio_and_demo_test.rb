require "test_helper"

class PortfolioAndDemoTest < ActionDispatch::IntegrationTest
  setup do
    PortfolioSeeder.new.call
    @previous_demo_mode = ENV["DEMO_MODE_ENABLED"]
    ENV["DEMO_MODE_ENABLED"] = "true"
    DemoWorkspaceSeeder.new.call
  end

  teardown do
    ENV["DEMO_MODE_ENABLED"] = @previous_demo_mode
  end

  test "published portfolio is public" do
    get "/api/portfolio"

    assert_response :success
    payload = JSON.parse(response.body)
    assert_equal "Divyarajsinh Solanki", payload.dig("profile", "full_name")
    assert_equal "Nexus Hub", payload.dig("projects", 0, "title")
    assert payload.dig("projects", 0, "cover_image_url").present?
    assert payload.dig("projects", 0, "features").all? { |feature| feature["screenshot_url"].present? }
  end

  test "demo session exposes manifest and rejects mutations" do
    post "/api/demo_session"
    assert_response :success
    assert JSON.parse(response.body).dig("user", "demo_account")

    get "/api/demo/manifest"
    assert_response :success
    assert_equal 6, JSON.parse(response.body).fetch("groups").length

    post "/api/posts", params: { post: { message: "Should not persist" } }
    assert_response :forbidden
    assert_equal "demo_read_only", JSON.parse(response.body).fetch("error")

    post "/upload_pdf"
    assert_response :forbidden
    assert_equal "demo_read_only", JSON.parse(response.body).fetch("error")
  end
end
