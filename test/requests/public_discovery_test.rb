require "test_helper"

class PublicDiscoveryTest < ActionDispatch::IntegrationTest
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
end
