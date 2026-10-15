require "test_helper"

class Auth::SessionsControllerTest < ActionDispatch::IntegrationTest
  test "POST /auth/login with valid credentials returns the user and a JWT" do
    post user_session_path, params: { user: { email: "customer@test.swstore", password: "password123" } }, as: :json

    assert_response :ok
    assert_match(/\ABearer \S+\z/, response.headers["Authorization"])
    body = json_response
    assert body["success"]
    assert_equal users(:customer).email, body["data"]["email"]
  end

  test "the password is never written to the log" do
    log = StringIO.new
    original_loggers = [ Rails.logger, ActionController::Base.logger ]
    Rails.logger = ActionController::Base.logger = ActiveSupport::Logger.new(log).tap { |logger| logger.level = :debug }

    post user_session_path, params: { user: { email: "customer@test.swstore", password: "password123" } }, as: :json

    assert_response :ok
    assert_not_includes log.string, "password123"
  ensure
    Rails.logger, ActionController::Base.logger = original_loggers
  end

  test "the JWT returned by login gives access to GET /auth/me" do
    post user_session_path, params: { user: { email: "customer@test.swstore", password: "password123" } }, as: :json
    token = response.headers["Authorization"]

    get api_v1_auth_me_path, headers: { "Authorization" => token }, as: :json

    assert_response :ok
    assert_equal users(:customer).id, json_response["data"]["id"]
  end

  test "POST /auth/login with a wrong password returns 401" do
    post user_session_path, params: { user: { email: "customer@test.swstore", password: "sbagliata" } }, as: :json

    assert_response :unauthorized
    assert_nil response.headers["Authorization"]
    assert_equal false, json_response["success"]
  end

  test "GET /auth/me without a token returns 401" do
    get api_v1_auth_me_path, as: :json

    assert_response :unauthorized
  end

  [ :post, :delete ].each do |verb|
    test "#{verb.upcase} /auth/logout revokes the token" do
      headers = auth_headers(users(:customer))

      send(verb, destroy_user_session_path, headers: headers)

      assert_response :ok
      assert json_response["success"]

      get api_v1_auth_me_path, headers: headers
      assert_response :unauthorized
    end
  end

  test "POST /auth/logout without a token returns 401" do
    post destroy_user_session_path, as: :json

    assert_response :unauthorized
    assert_equal false, json_response["success"]
  end

  test "GET /auth/me with the test helper headers returns the admin flag" do
    get api_v1_auth_me_path, headers: auth_headers(users(:admin))

    assert_response :ok
    assert json_response["data"]["admin"]
  end
end
