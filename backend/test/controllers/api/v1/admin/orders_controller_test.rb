require "test_helper"

class Api::V1::Admin::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @order = orders(:customer_pending)
  end

  test "non-admin users get 403" do
    get api_v1_admin_orders_path, headers: auth_headers(users(:customer))

    assert_response :forbidden
  end

  test "PUT /admin/orders/:id applies an allowed status transition" do
    put api_v1_admin_order_path(@order), params: { order: { status: "paid" } }, headers: auth_headers(@admin), as: :json

    assert_response :ok
    assert @order.reload.paid?
  end

  test "PUT /admin/orders/:id rejects a transition that skips the lifecycle with 422" do
    put api_v1_admin_order_path(@order), params: { order: { status: "delivered" } }, headers: auth_headers(@admin), as: :json

    assert_response :unprocessable_entity
    assert json_response["errors"].any?
    assert @order.reload.pending?
  end

  test "PUT /admin/orders/:id rejects an unknown status with 422" do
    put api_v1_admin_order_path(@order), params: { order: { status: "lost" } }, headers: auth_headers(@admin), as: :json

    assert_response :unprocessable_entity
  end

  test "DELETE /admin/orders/:id cancels the order and restores the stock" do
    assert_difference -> { products(:headphones).reload.stock_quantity }, 2 do
      delete api_v1_admin_order_path(@order), headers: auth_headers(@admin)
    end

    assert_response :ok
    assert @order.reload.cancelled?
  end

  test "DELETE /admin/orders/:id of a shipped order returns 422" do
    delete api_v1_admin_order_path(orders(:customer_shipped)), headers: auth_headers(@admin)

    assert_response :unprocessable_entity
  end

  test "GET /admin/orders sorts by an allowed column and rejects the others with 400" do
    get api_v1_admin_orders_path, params: { order_by: "total_amount", order_direction: "desc" }, headers: auth_headers(@admin)
    assert_response :ok
    totals = json_response["data"].map { |order| order["total_amount"].to_d }
    assert_equal totals.sort.reverse, totals

    get api_v1_admin_orders_path, params: { order_by: "user_id" }, headers: auth_headers(@admin)
    assert_response :bad_request
  end

  test "GET /admin/orders combines the customer search with the date filter" do
    get api_v1_admin_orders_path, params: { q: "Carlo", from_date: 1.day.ago.to_date.iso8601 }, headers: auth_headers(@admin)

    assert_response :ok
    assert_equal users(:customer).orders.count, json_response["data"].size
  end
end
