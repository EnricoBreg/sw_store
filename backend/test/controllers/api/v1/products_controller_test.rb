require "test_helper"

class Api::V1::ProductsControllerTest < ActionDispatch::IntegrationTest
  test "GET /products returns the list ordered by name with pagination meta" do
    get api_v1_products_path, as: :json

    assert_response :ok
    body = json_response
    assert body["success"]
    names = body["data"].map { |product| product["name"] }
    assert_equal names.sort, names
    assert_equal Product.count, body["meta"]["count"]
    assert_equal 1, body["meta"]["page"]
  end

  test "GET /products filters by text search" do
    get api_v1_products_path, params: { q: "tastiera" }

    assert_response :ok
    assert_equal [ products(:keyboard).id ], json_response["data"].map { |product| product["id"] }
  end

  test "GET /products filters by category" do
    get api_v1_products_path, params: { category_id: categories(:videogames).id }

    assert_response :ok
    assert_equal [ products(:console).id ], json_response["data"].map { |product| product["id"] }
  end

  test "GET /products paginates with page and limit" do
    get api_v1_products_path, params: { page: 2, limit: 2 }

    assert_response :ok
    body = json_response
    assert_equal 1, body["data"].size
    assert_equal 2, body["meta"]["page"]
    assert_equal 2, body["meta"]["pages"]
  end

  test "GET /products/:id returns the product with its category" do
    product = products(:headphones)
    get api_v1_product_path(product), as: :json

    assert_response :ok
    data = json_response["data"]
    assert_equal product.id, data["id"]
    assert_equal product.name, data["name"]
    assert_equal categories(:electronics).name, data["category"]["name"]
  end

  test "GET /products/:id returns 404 with the standard error format" do
    get api_v1_product_path(id: 0), as: :json

    assert_response :not_found
    body = json_response
    assert_equal false, body["success"]
    assert body["message"].present?
  end

  test "GET /products shows only active products" do
    products(:keyboard).update_columns(active: false)

    get api_v1_products_path, as: :json

    ids = json_response["data"].map { |product| product["id"] }
    assert_not_includes ids, products(:keyboard).id
    assert_equal Product.active.count, json_response["meta"]["count"]
  end

  test "GET /products/:id of an inactive product returns 404" do
    products(:keyboard).update_columns(active: false)

    get api_v1_product_path(products(:keyboard)), as: :json

    assert_response :not_found
  end

  test "GET /products sorts by an allowed column" do
    get api_v1_products_path, params: { order_by: "price", order_direction: "desc" }

    assert_response :ok
    prices = json_response["data"].map { |product| product["price"].to_d }
    assert_equal prices.sort.reverse, prices
  end

  test "GET /products rejects a column or direction that is not allowed with 400" do
    get api_v1_products_path, params: { order_by: "stock_quantity" }
    assert_response :bad_request
    assert_match "name, price, created_at", json_response["errors"].sole

    get api_v1_products_path, params: { order_by: "price", order_direction: "sideways" }
    assert_response :bad_request
  end

  test "GET /products treats LIKE wildcards in q as plain text" do
    get api_v1_products_path, params: { q: "%" }

    assert_response :ok
    assert_empty json_response["data"]
  end
end
