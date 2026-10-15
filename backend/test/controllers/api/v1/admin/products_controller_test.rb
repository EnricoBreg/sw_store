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

  # --- Immagine (multipart/form-data) ---

  def multipart_product(**fields)
    { product: { name: "Mouse", description: "Mouse ottico senza fili", price: "19.90", stock_quantity: "5",
                 active: "true", category_id: categories(:electronics).id }.merge(fields) }
  end

  test "POST /admin/products in multipart creates the product with its image" do
    post api_v1_admin_products_path,
      params: multipart_product(image: fixture_file_upload("product.jpg", "image/jpeg")),
      headers: @headers

    assert_response :created
    data = json_response["data"]
    assert_match %r{/rails/active_storage/.+/product\.jpg\z}, data["image_url"]
    assert data["thumbnail_url"].present?
    assert_equal BigDecimal("19.9"), Product.find(data["id"]).price
  end

  test "an image whose content is not JPEG, PNG or WebP is rejected with 422" do
    assert_no_difference -> { Product.count } do
      post api_v1_admin_products_path,
        params: multipart_product(image: fixture_file_upload("not_an_image.jpg", "image/jpeg")),
        headers: @headers.merge("Accept-Language" => "en")
    end

    assert_response :unprocessable_entity
    assert_equal [ "Image must be a JPEG, PNG, WebP file." ], json_response["errors"]
  end

  test "an image larger than 5 MB is rejected with 422" do
    big = Tempfile.new([ "big", ".png" ])
    big.binmode
    big.write("\x89PNG\r\n\x1A\n".b + ("\0" * (5.megabytes + 1)))
    big.rewind

    put api_v1_admin_product_path(products(:keyboard)),
      params: { product: { image: Rack::Test::UploadedFile.new(big.path, "image/png") } },
      headers: @headers

    assert_response :unprocessable_entity
    assert_equal [ "Immagine non può superare 5 MB." ], json_response["errors"]
    assert_not products(:keyboard).reload.image.attached?
  ensure
    big&.close!
  end

  test "PUT /admin/products/:id replaces and removes the image" do
    product = products(:keyboard)

    put api_v1_admin_product_path(product), params: { product: { image: fixture_file_upload("product.jpg", "image/jpeg") } }, headers: @headers
    assert_response :ok
    assert product.reload.image.attached?

    put api_v1_admin_product_path(product), params: { product: { remove_image: "true" } }, headers: @headers
    assert_response :ok
    assert_not product.reload.image.attached?
    assert_nil json_response["data"]["image_url"]
  end

  test "an image sent as a JSON string is ignored" do
    put api_v1_admin_product_path(products(:keyboard)), params: { product: { image: "not-a-file", price: 70 } }, headers: @headers, as: :json

    assert_response :ok
    assert_not products(:keyboard).reload.image.attached?
    assert_equal BigDecimal("70"), products(:keyboard).price
  end
end
