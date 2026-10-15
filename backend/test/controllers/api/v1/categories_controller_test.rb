require "test_helper"

class Api::V1::CategoriesControllerTest < ActionDispatch::IntegrationTest
  test "GET /categories searches by name" do
    get api_v1_categories_path, params: { q: "video" }

    assert_response :ok
    assert_equal [ categories(:videogames).id ], json_response["data"].map { |category| category["id"] }
  end

  test "GET /categories?all=true returns every category without pagination" do
    35.times { |index| Category.create!(name: "Categoria #{index}") }

    get api_v1_categories_path, params: { all: true, limit: 5 }

    assert_response :ok
    assert_equal Category.count, json_response["data"].size
    assert_equal({ "count" => Category.count }, json_response["meta"])
  end

  test "GET /categories is paginated by default" do
    35.times { |index| Category.create!(name: "Categoria #{index}") }

    get api_v1_categories_path

    assert_response :ok
    assert_equal 10, json_response["data"].size
    assert_equal Category.count, json_response["meta"]["count"]
  end
end
