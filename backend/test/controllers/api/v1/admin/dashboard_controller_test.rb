require "test_helper"

class Api::V1::Admin::DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = auth_headers(users(:admin))
  end

  test "GET /admin/dashboard returns the summary statistics" do
    orders(:other_customer_pending).update_columns(status: "cancelled")

    get api_v1_admin_dashboard_path, headers: @headers

    assert_response :ok
    data = json_response["data"]
    assert_equal 3, data["orders_count"]
    assert_equal({ "pending" => 1, "paid" => 0, "shipped" => 1, "delivered" => 0, "cancelled" => 1, "refunded" => 0 },
      data["orders_by_status"])
    assert_equal "258.82", data["revenue"], "cancelled orders are excluded"
    assert_equal 3, data["products_count"]
    assert_equal 3, data["active_products_count"]
    assert_equal User.count, data["users_count"]
    assert_equal 3, data["latest_orders"].size
  end

  test "low stock products use the threshold and include only active products" do
    products(:keyboard).update_columns(stock_quantity: 2)
    products(:console).update_columns(stock_quantity: 1, active: false)

    get api_v1_admin_dashboard_path, headers: @headers
    assert_equal 5, json_response["data"]["low_stock_threshold"]
    assert_equal [ products(:keyboard).id ], json_response["data"]["low_stock_products"].map { |product| product["id"] }

    get api_v1_admin_dashboard_path, params: { low_stock_threshold: 30 }, headers: @headers
    assert_equal [ products(:keyboard).id, products(:headphones).id ],
      json_response["data"]["low_stock_products"].map { |product| product["id"] }
  end

  test "an invalid low_stock_threshold returns 400" do
    get api_v1_admin_dashboard_path, params: { low_stock_threshold: "-1" }, headers: @headers

    assert_response :bad_request
  end

  test "the dashboard is reserved to admins" do
    get api_v1_admin_dashboard_path, headers: auth_headers(users(:customer))

    assert_response :forbidden
  end
end
