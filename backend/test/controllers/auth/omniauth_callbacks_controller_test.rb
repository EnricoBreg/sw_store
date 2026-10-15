require "test_helper"

class Auth::OmniauthCallbacksControllerTest < ActionDispatch::IntegrationTest
  setup do
    OmniAuth.config.test_mode = true
  end

  teardown do
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    OmniAuth.config.test_mode = false
  end

  def mock_google(uid:, email:)
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: uid,
      info: { email: email, first_name: "Carlo", last_name: "Cliente" }
    )
  end

  test "successful callback redirects to the frontend with a JWT in the fragment, valid for /auth/me" do
    mock_google(uid: "g-customer", email: "customer@test.swstore")

    get user_google_oauth2_omniauth_callback_path

    assert_response :redirect
    location = URI.parse(response.location)
    assert_equal "#{Rails.configuration.x.frontend_url}/oauth/callback", "#{location.scheme}://#{location.host}:#{location.port}#{location.path}"
    assert_nil location.query, "the token must not be sent in the query string"
    token = URI.decode_www_form(location.fragment).to_h.fetch("token")

    get api_v1_auth_me_path, headers: { "Authorization" => "Bearer #{token}" }, as: :json

    assert_response :ok
    assert_equal users(:customer).id, json_response["data"]["id"]
  end

  test "the Google login does not invalidate the tokens of other sessions" do
    headers = auth_headers(users(:customer))
    mock_google(uid: "g-customer", email: "customer@test.swstore")

    get user_google_oauth2_omniauth_callback_path
    get api_v1_auth_me_path, headers: headers

    assert_response :ok
  end

  test "callback without a verified email redirects to the login page with an error" do
    mock_google(uid: "g-unverified", email: nil)

    get user_google_oauth2_omniauth_callback_path

    assert_redirected_to "#{Rails.configuration.x.frontend_url}/login?error=oauth_failed"
  end
end
