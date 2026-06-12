require "test_helper"

class PublicDiscoveryTest < ActionDispatch::IntegrationTest
  setup do
    @previous_portfolio_mode = ENV["PORTFOLIO_ENABLED"]
    ENV["PORTFOLIO_ENABLED"] = "true"
  end

  teardown do
    ENV["PORTFOLIO_ENABLED"] = @previous_portfolio_mode
  end

  test "sitemap and robots expose public portfolio discovery routes" do
    base_url = ENV.fetch("BASE_URL", "http://www.example.com").delete_suffix("/")

    get "/sitemap.xml"
    assert_response :success
    assert_includes response.body, "<loc>#{base_url}/</loc>"
    assert_includes response.body, "<loc>#{base_url}/contact</loc>"

    get "/robots.txt"
    assert_response :success
    assert_includes response.body, "Allow: /"
    assert_includes response.body, "Disallow: /admin"
    assert_includes response.body, "Sitemap: #{base_url}/sitemap.xml"
  end

  test "disabled portfolio mode exposes the login runtime flag and removes portfolio discovery routes" do
    ENV.delete("PORTFOLIO_ENABLED")

    get "/"
    assert_response :success
    assert_select 'meta[name="nexus-portfolio-enabled"][content="false"]', count: 1
    assert_select "title", text: "Nexus Hub | Workspace Login"

    get "/sitemap.xml"
    assert_response :success
    assert_not_includes response.body, "/contact"
  end
end
