require "test_helper"

class Api::V1::Admin::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @headers = auth_headers(@admin)
  end

  test "GET /admin/users sorts by an allowed column and rejects the others with 400" do
    get api_v1_admin_users_path, params: { order_by: "email", order_direction: "desc" }, headers: @headers
    assert_response :ok
    emails = json_response["data"].map { |user| user["email"] }
    assert_equal emails.sort.reverse, emails

    get api_v1_admin_users_path, params: { order_by: "encrypted_password" }, headers: @headers
    assert_response :bad_request
  end

  test "an admin cannot delete their own account from the admin area" do
    delete api_v1_admin_user_path(@admin), headers: @headers

    assert_response :forbidden
    assert_equal false, json_response["success"]
    assert User.exists?(@admin.id)
  end

  test "an admin can delete another user" do
    user = User.create!(email: "temp@test.swstore", password: "password123")

    delete api_v1_admin_user_path(user), headers: @headers

    assert_response :ok
    assert_not User.exists?(user.id)
  end
end
