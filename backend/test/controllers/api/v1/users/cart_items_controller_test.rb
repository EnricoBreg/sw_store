require "test_helper"

class Api::V1::Users::CartItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @customer = users(:customer)
    @headers = auth_headers(@customer)
    @own_item = cart_items(:customer_headphones)
    @other_item = cart_items(:other_customer_keyboard)
  end

  def add_to_cart(product, quantity)
    post api_v1_cart_items_path, params: { cart_item: { product_id: product.id, quantity: quantity } }, headers: @headers, as: :json
  end

  def update_item(item, quantity)
    patch api_v1_cart_item_path(item), params: { cart_item: { quantity: quantity } }, headers: @headers, as: :json
  end

  test "cart endpoints require authentication" do
    get api_v1_cart_path, as: :json
    assert_response :unauthorized
  end

  test "GET /cart returns the lines with their id, prices and totals" do
    get api_v1_cart_path, headers: @headers

    assert_response :ok
    cart = json_response["data"]
    item = cart["items"].sole
    assert_equal @own_item.id, item["id"]
    assert_equal products(:headphones).id, item["product_id"]
    assert_equal 2, item["quantity"]
    assert_equal "99.9", item["unit_price"]
    assert_equal "89.91", item["discounted_unit_price"]
    assert_equal "179.82", item["total_price"]
    assert_equal 2, cart["items_count"]
    assert_equal "179.82", cart["total_amount"]
  end

  test "POST /cart/items adds a new product" do
    add_to_cart(products(:keyboard), 1)

    assert_response :created
    product_ids = json_response["data"]["items"].map { |item| item["product_id"] }
    assert_includes product_ids, products(:keyboard).id
  end

  test "POST /cart/items sums the quantity of a product already in the cart" do
    assert_no_difference -> { CartItem.count } do
      add_to_cart(products(:headphones), 3)
    end

    assert_response :created
    assert_equal 5, @own_item.reload.quantity
  end

  test "POST /cart/items defaults the quantity to 1" do
    post api_v1_cart_items_path, params: { cart_item: { product_id: products(:keyboard).id } }, headers: @headers, as: :json

    assert_response :created
    assert_equal 1, @customer.cart.cart_items.find_by(product: products(:keyboard)).quantity
  end

  test "POST /cart/items rejects an inactive product with 422" do
    products(:keyboard).update_columns(active: false)

    assert_no_difference -> { CartItem.count } do
      add_to_cart(products(:keyboard), 1)
    end

    assert_response :unprocessable_entity
    assert_equal false, json_response["success"]
    assert_includes json_response["errors"].sole, products(:keyboard).name
  end

  test "POST /cart/items rejects a total quantity above the stock with 422" do
    add_to_cart(products(:headphones), products(:headphones).stock_quantity)

    assert_response :unprocessable_entity
    assert_equal 2, @own_item.reload.quantity
  end

  test "POST /cart/items rejects an invalid quantity with 422" do
    [ 0, -1, "abc" ].each do |quantity|
      add_to_cart(products(:keyboard), quantity)
      assert_response :unprocessable_entity, "quantity #{quantity.inspect}"
    end
  end

  test "POST /cart/items with an unknown product returns 404" do
    post api_v1_cart_items_path, params: { cart_item: { product_id: 0, quantity: 1 } }, headers: @headers, as: :json

    assert_response :not_found
  end

  test "POST /cart/items answers in English with Accept-Language: en" do
    products(:keyboard).update_columns(active: false)
    post api_v1_cart_items_path,
      params: { cart_item: { product_id: products(:keyboard).id, quantity: 1 } },
      headers: @headers.merge("Accept-Language" => "en"),
      as: :json

    assert_response :unprocessable_entity
    assert_equal "The product #{products(:keyboard).name} is not available.", json_response["errors"].sole
  end

  test "PATCH /cart/items/:id sets the quantity of an own line" do
    update_item(@own_item, 4)

    assert_response :ok
    assert_equal 4, @own_item.reload.quantity
    assert_equal 4, json_response["data"]["items_count"]
  end

  test "PATCH /cart/items/:id rejects quantity 0 and quantities above the stock" do
    update_item(@own_item, 0)
    assert_response :unprocessable_entity

    update_item(@own_item, products(:headphones).stock_quantity + 1)
    assert_response :unprocessable_entity

    assert_equal 2, @own_item.reload.quantity
  end

  test "PATCH /cart/items/:id of another user returns 404" do
    update_item(@other_item, 1)

    assert_response :not_found
    assert_equal 1, @other_item.reload.quantity
  end

  test "DELETE /cart/items/:id removes an own line" do
    delete api_v1_cart_item_path(@own_item), headers: @headers

    assert_response :ok
    assert_empty json_response["data"]["items"]
    assert_equal "0.0", json_response["data"]["total_amount"]
    assert_not CartItem.exists?(@own_item.id)
  end

  test "DELETE /cart/items/:id of another user or of an unknown line returns 404" do
    delete api_v1_cart_item_path(@other_item), headers: @headers
    assert_response :not_found
    assert CartItem.exists?(@other_item.id)

    delete api_v1_cart_item_path(id: 0), headers: @headers
    assert_response :not_found
  end
end
