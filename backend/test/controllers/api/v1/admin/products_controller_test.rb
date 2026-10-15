require "test_helper"

class Api::V1::Admin::ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = auth_headers(users(:admin))
  end

  test "GET /admin/products includes inactive products" do
    products(:keyboard).update_columns(active: false)

    get api_v1_admin_products_path, headers: @headers

    assert_response :ok
    assert_includes json_response["data"].map { |product| product["id"] }, products(:keyboard).id
  end

  test "GET /admin/products sorts by an allowed column and rejects the others with 400" do
    get api_v1_admin_products_path, params: { order_by: "stock_quantity", order_direction: "asc" }, headers: @headers
    assert_response :ok
    stocks = json_response["data"].map { |product| product["stock_quantity"] }
    assert_equal stocks.sort, stocks

    get api_v1_admin_products_path, params: { order_by: "foo" }, headers: @headers
    assert_response :bad_request
  end

  test "POST /admin/products creates an active product by default" do
    post api_v1_admin_products_path,
      params: { product: { name: "Mouse", description: "Mouse ottico senza fili", price: 19.9, stock_quantity: 5, category_id: categories(:electronics).id } },
      headers: @headers, as: :json

    assert_response :created
    assert json_response["data"]["active"]
  end

  test "PUT /admin/products/:id returns 200 with the updated message" do
    put api_v1_admin_product_path(products(:keyboard)), params: { product: { price: 89 } }, headers: @headers, as: :json

    assert_response :ok
    assert_equal "Prodotto #{products(:keyboard).name} aggiornato con successo.", json_response["message"]
    assert_equal BigDecimal("89"), products(:keyboard).reload.price
  end

  test "DELETE /admin/products/:id of a product never ordered removes it with its cart and wishlist lines" do
    product = products(:keyboard)
    OrderItem.where(product: product).delete_all
    wishlists(:customer_wishlist).wishlist_items.create!(product: product)

    delete api_v1_admin_product_path(product), headers: @headers

    assert_response :ok
    assert_not Product.exists?(product.id)
    assert_not CartItem.exists?(product_id: product.id)
    assert_not WishlistItem.exists?(product_id: product.id)
  end
end
