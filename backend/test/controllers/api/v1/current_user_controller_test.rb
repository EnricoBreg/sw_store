require "test_helper"

class Api::V1::CurrentUserControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:customer)
    @headers = auth_headers(@user)
  end

  def update_me(attributes)
    put api_v1_auth_me_path, params: { user: attributes }, headers: @headers, as: :json
  end

  test "PUT /auth/me updates the personal data without the current password" do
    update_me(first_name: "Carla", last_name: "Rossi", number: "+390000000")

    assert_response :ok
    assert_equal "Carla Rossi", json_response["data"]["full_name"]
    assert_equal "+390000000", @user.reload.number
  end

  test "PUT /auth/me returns 422 with the validation errors" do
    update_me(date_of_birth: 10.years.ago.to_date)

    assert_response :unprocessable_entity
    assert_equal false, json_response["success"]
    assert json_response["errors"].any?
  end

  test "PUT /auth/me ignores attributes that are not permitted" do
    update_me(first_name: "Carla", admin: true)

    assert_response :ok
    assert_not @user.reload.admin?
  end

  test "PUT /auth/me changes the password only with the current password" do
    update_me(password: "nuovaPassword1", password_confirmation: "nuovaPassword1")
    assert_response :unprocessable_entity

    update_me(password: "nuovaPassword1", password_confirmation: "nuovaPassword1", current_password: "password123")
    assert_response :ok
    assert @user.reload.valid_password?("nuovaPassword1")
  end

  test "PUT /auth/me changes the email only with the current password" do
    update_me(email: "nuova@test.swstore")
    assert_response :unprocessable_entity
    assert_equal "customer@test.swstore", @user.reload.email

    update_me(email: "nuova@test.swstore", current_password: "password123")
    assert_response :ok
    assert_equal "nuova@test.swstore", @user.reload.email
  end

  test "PUT /auth/me without the user payload returns 400" do
    put api_v1_auth_me_path, params: {}, headers: @headers, as: :json

    assert_response :bad_request
  end
end
