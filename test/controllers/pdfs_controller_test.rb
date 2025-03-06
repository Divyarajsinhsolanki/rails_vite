require "test_helper"

class PdfsControllerTest < ActionDispatch::IntegrationTest
  test "should get modify" do
    get pdfs_modify_url
    assert_response :success
  end
end
