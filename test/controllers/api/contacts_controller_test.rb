require "test_helper"

class Api::ContactsControllerTest < ActionDispatch::IntegrationTest
  def contact_payload(overrides = {})
    {
      contact: {
        name: "Test User",
        email: "test@example.com",
        message: "Hello world",
        captcha_num1: 1,
        captcha_num2: 2,
        captcha_answer: 3
      }.merge(overrides)
    }
  end

  test "creates contact when captcha is valid" do
    assert_difference("Contact.count", 1) do
      post api_contacts_path, params: contact_payload
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal({ "message" => "Thank you for your message!" }, body)
  end

  test "returns error when captcha answer is incorrect" do
    assert_no_difference("Contact.count") do
      post api_contacts_path, params: contact_payload(captcha_answer: 5)
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal({ "errors" => ["Invalid captcha answer"] }, body)
  end

  test "returns error when captcha data is missing" do
    payload = contact_payload.except(:contact)

    assert_no_difference("Contact.count") do
      post api_contacts_path, params: payload
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal({ "errors" => ["Invalid captcha answer"] }, body)
  end

  test "returns error when captcha fields are absent" do
    assert_no_difference("Contact.count") do
      post api_contacts_path, params: contact_payload(captcha_num1: nil, captcha_num2: nil, captcha_answer: nil)
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal({ "errors" => ["Invalid captcha answer"] }, body)
  end
end
