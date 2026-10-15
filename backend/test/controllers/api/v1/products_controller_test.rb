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
end
