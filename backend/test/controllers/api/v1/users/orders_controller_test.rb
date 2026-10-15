require "test_helper"

class Api::V1::Users::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @customer = users(:customer)
    @own_order = orders(:customer_pending)
    @other_order = orders(:other_customer_pending)
  end

  test "GET /orders lists only the orders of the current user" do
    get api_v1_orders_path, headers: auth_headers(@customer)

    assert_response :ok
    ids = json_response["data"].map { |order| order["id"] }
    assert_equal @customer.orders.ids.sort, ids.sort
    assert_not_includes ids, @other_order.id
  end

  test "GET /orders requires authentication" do
    get api_v1_orders_path, as: :json

    assert_response :unauthorized
  end

  test "GET /orders/:id returns an own order" do
    get api_v1_order_path(@own_order), headers: auth_headers(@customer)

    assert_response :ok
    assert_equal @own_order.code, json_response["data"]["code"]
  end

  test "GET /orders/:id of another user returns 404" do
    get api_v1_order_path(@other_order), headers: auth_headers(@customer)

    assert_response :not_found
    assert_equal false, json_response["success"]
  end

  test "PUT /orders/:id of another user returns 404 and leaves the order unchanged" do
    put api_v1_order_path(@other_order),
      params: { order: { city: "Napoli" } },
      headers: auth_headers(@customer),
      as: :json

    assert_response :not_found
    assert_equal "Milano", @other_order.reload.city
  end

  test "DELETE /orders/:id of another user returns 404 and does not cancel it" do
    assert_no_difference -> { products(:console).reload.stock_quantity } do
      delete api_v1_order_path(@other_order), headers: auth_headers(@customer)
    end

    assert_response :not_found
    assert @other_order.reload.pending?
  end

  test "DELETE /orders/:id cancels a pending order and restores the stock" do
    assert_difference -> { products(:headphones).reload.stock_quantity }, 2 do
      delete api_v1_order_path(@own_order), headers: auth_headers(@customer)
    end

    assert_response :ok
    assert @own_order.reload.cancelled?
  end

  test "DELETE /orders/:id of a shipped order returns 422" do
    shipped = orders(:customer_shipped)

    assert_no_difference -> { products(:keyboard).reload.stock_quantity } do
      delete api_v1_order_path(shipped), headers: auth_headers(@customer)
    end

    assert_response :unprocessable_entity
    assert_equal false, json_response["success"]
    assert json_response["errors"].any?
    assert shipped.reload.shipped?
  end

  test "DELETE /orders/:id twice returns 422 the second time" do
    delete api_v1_order_path(@own_order), headers: auth_headers(@customer)
    assert_response :ok

    delete api_v1_order_path(@own_order), headers: auth_headers(@customer)
    assert_response :unprocessable_entity
  end
end
