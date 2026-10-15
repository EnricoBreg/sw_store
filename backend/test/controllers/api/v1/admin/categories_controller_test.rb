require "test_helper"

class Api::V1::Admin::CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = auth_headers(users(:admin))
  end

  test "PUT /admin/categories/:id returns 200 with the updated message" do
    put api_v1_admin_category_path(categories(:videogames)), params: { category: { name: "Gaming" } }, headers: @headers, as: :json

    assert_response :ok
    assert_equal "Categoria Gaming aggiornata con successo.", json_response["message"]
  end

  test "DELETE /admin/categories/:id of an empty category removes it" do
    category = Category.create!(name: "Vuota")

    delete api_v1_admin_category_path(category), headers: @headers

    assert_response :ok
    assert_not Category.exists?(category.id)
  end

  test "DELETE /admin/categories/:id with products returns 409 and deletes nothing" do
    assert_no_difference -> { Product.count } do
      delete api_v1_admin_category_path(categories(:videogames)), headers: @headers
    end

    assert_response :conflict
    assert Category.exists?(categories(:videogames).id)
  end
end
