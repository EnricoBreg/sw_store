require "test_helper"

class Api::V1::Users::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @customer = users(:customer)
    @own_order = orders(:customer_pending)
    @other_order = orders(:other_customer_pending)
  end

  def checkout(**overrides)
    order = {
      first_name: "Carlo", last_name: "Cliente", street: "Via Roma 1", city: "Milano",
      zip_code: "20100", country: "Italia", stripe_payment_token: "tok_test"
    }.merge(overrides)
    post api_v1_orders_path, params: { order: order }, headers: auth_headers(@customer), as: :json
  end

  test "POST /orders creates the order from the cart, decrements the stock and empties the cart" do
    headphones = products(:headphones)

    assert_difference -> { @customer.orders.count }, 1 do
      assert_difference -> { headphones.reload.stock_quantity }, -2 do
        checkout
      end
    end

    assert_response :created
    order = json_response["data"]
    assert_equal "pending", order["status"]
    assert_equal "179.82", order["total_amount"]
    item = order["items"].sole
    assert_equal 2, item["quantity"]
    assert_equal "89.91", item["unit_price"]
    assert_equal "179.82", item["total_price"], "the discount must be applied only once"
    assert @customer.cart.reload.empty?
  end

  test "POST /orders with an empty cart returns 422 with errors" do
    @customer.cart.cart_items.destroy_all

    assert_no_difference -> { Order.count } do
      checkout
    end

    assert_response :unprocessable_entity
    assert json_response["errors"].any?
  end

  test "POST /orders with insufficient stock returns 422 and changes nothing" do
    products(:headphones).update_columns(stock_quantity: 1)

    assert_no_difference -> { Order.count } do
      checkout
    end

    assert_response :unprocessable_entity
    assert_includes json_response["errors"].sole, products(:headphones).name
    assert_equal 1, products(:headphones).reload.stock_quantity
    assert_equal 2, cart_items(:customer_headphones).reload.quantity
  end

  test "POST /orders with an inactive product returns 422 and changes nothing" do
    products(:headphones).update_columns(active: false)

    assert_no_difference -> { Order.count } do
      checkout
    end

    assert_response :unprocessable_entity
    assert_includes json_response["errors"].sole, products(:headphones).name
    assert_equal 25, products(:headphones).reload.stock_quantity
    assert CartItem.exists?(cart_items(:customer_headphones).id)
  end

  test "POST /orders with missing form data returns 422 with the validation errors" do
    assert_no_difference -> { Order.count } do
      checkout(city: "", stripe_payment_token: nil)
    end

    assert_response :unprocessable_entity
    assert_equal 2, json_response["errors"].size
    assert_equal 25, products(:headphones).reload.stock_quantity
    assert_not @customer.cart.reload.empty?
  end

  test "POST /orders without the order payload returns 400" do
    post api_v1_orders_path, params: {}, headers: auth_headers(@customer), as: :json

    assert_response :bad_request
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

  test "GET /orders filters by one or more statuses" do
    get api_v1_orders_path, params: { status: "shipped" }, headers: auth_headers(@customer)
    assert_response :ok
    assert_equal [ orders(:customer_shipped).id ], json_response["data"].map { |order| order["id"] }

    get api_v1_orders_path, params: { status: "pending,shipped" }, headers: auth_headers(@customer)
    assert_equal 2, json_response["data"].size

    get api_v1_orders_path, params: { status: "delivered" }, headers: auth_headers(@customer)
    assert_empty json_response["data"]
  end

  test "GET /orders with an unknown status returns 400" do
    get api_v1_orders_path, params: { status: "lost" }, headers: auth_headers(@customer)

    assert_response :bad_request
    assert_match "pending, paid, shipped", json_response["errors"].sole
  end
end
