require "test_helper"

# Controller di prova per gli errori che nessun endpoint reale solleva in modo affidabile.
class ErrorProbeController < Api::V1::BaseController
  def internal_error
    raise "dettaglio tecnico che non deve arrivare al client"
  end

  def record_invalid
    User.new.save!
  end

  def conflict
    raise ActiveRecord::RecordNotUnique, "duplicate key value violates unique constraint"
  end
end

class Api::V1::ErrorHandlingTest < ActionDispatch::IntegrationTest
  EN = { "Accept-Language" => "en-US,en;q=0.9" }.freeze

  def assert_error_format(status, message)
    assert_response status
    body = json_response
    assert_equal false, body["success"]
    assert_equal message, body["message"]
    assert body["errors"].is_a?(Array) && body["errors"].any?, "errors must be a non-empty array"
  end

  # --- Lingua ---

  test "404 is translated according to Accept-Language" do
    get api_v1_product_path(id: 0), headers: EN, as: :json
    assert_error_format :not_found, "The requested resource was not found."

    get api_v1_product_path(id: 0), as: :json
    assert_error_format :not_found, "La risorsa richiesta non è stata trovata."
  end

  test "an unsupported language falls back to Italian" do
    get api_v1_product_path(id: 0), headers: { "Accept-Language" => "fr" }, as: :json

    assert_error_format :not_found, "La risorsa richiesta non è stata trovata."
  end

  test "422 validation errors are translated, including model messages" do
    put api_v1_auth_me_path, params: { user: { date_of_birth: 10.years.ago.to_date } },
      headers: auth_headers(users(:customer), EN), as: :json

    assert_error_format :unprocessable_entity, "Error during the update of the information. Please try again later."
    assert_equal [ "Date of birth must belong to an adult (at least 18 years old)." ], json_response["errors"]
  end

  test "422 from RecordInvalid is translated" do
    with_routing do |set|
      set.draw { get "probe/record_invalid", to: "error_probe#record_invalid" }
      get "/probe/record_invalid", headers: EN

      assert_error_format :unprocessable_entity, "The submitted data is not valid."
      assert_includes json_response["errors"], "Email address can't be blank"
    end
  end

  # --- 400 ---

  test "a missing root parameter returns 400" do
    post api_v1_orders_path, params: { something: 1 }, headers: auth_headers(users(:customer), EN), as: :json

    assert_error_format :bad_request, "Some parameters were not found."
    assert_equal [ "Missing or empty parameter: order." ], json_response["errors"]
  end

  test "malformed JSON returns 400" do
    post api_v1_cart_items_path, params: "{ not json",
      headers: auth_headers(users(:customer), "Content-Type" => "application/json")

    assert_error_format :bad_request, "La richiesta non è valida."
  end

  test "an unparsable date returns 400" do
    get api_v1_admin_orders_path, params: { from_date: "not-a-date" }, headers: auth_headers(users(:admin))

    assert_error_format :bad_request, "La richiesta non è valida."
  end

  test "an order_by that is not a column reference returns 400" do
    get api_v1_admin_products_path, params: { order_by: "name; DROP TABLE products" }, headers: auth_headers(users(:admin))

    assert_error_format :bad_request, "La richiesta non è valida."
  end

  # --- 401 / 403 ---

  test "401 without a token uses the standard format" do
    get api_v1_cart_path, headers: EN, as: :json

    assert_error_format :unauthorized, "You must authenticate to proceed."
  end

  test "401 with an invalid token uses the standard format" do
    get api_v1_cart_path, headers: { "Authorization" => "Bearer not.a.jwt" }, as: :json

    assert_error_format :unauthorized, "Devi autenticarti per procedere."
  end

  test "401 for wrong credentials uses the standard format and the request language" do
    post user_session_path, params: { user: { email: "customer@test.swstore", password: "wrong" } }, headers: EN, as: :json

    assert_error_format :unauthorized, "Invalid email address or password."
  end

  test "403 for a non-admin user uses the standard format" do
    get api_v1_admin_products_path, headers: auth_headers(users(:customer), EN)

    assert_error_format :forbidden, "You do not have the necessary permissions to perform the requested action."
  end

  # --- 409 ---

  test "deleting a product referenced by orders returns 409 and keeps the product" do
    delete api_v1_admin_product_path(products(:headphones)), headers: auth_headers(users(:admin), EN)

    assert_error_format :conflict, "Unable to delete the product #{products(:headphones).name}."
    assert_equal [ "Cannot delete record because dependent orders exist" ], json_response["errors"]
    assert Product.exists?(products(:headphones).id)
  end

  test "deleting a category that still has products returns 409" do
    delete api_v1_admin_category_path(categories(:electronics)), headers: auth_headers(users(:admin))

    assert_error_format :conflict, "Impossibile eliminare la categoria Elettronica."
    assert_equal [ "Il record non può essere cancellato perchè esistono prodotti dipendenti" ], json_response["errors"]
    assert Category.exists?(categories(:electronics).id)
  end

  test "an integrity violation not handled by the endpoint returns the generic 409" do
    with_routing do |set|
      set.draw { get "probe/conflict", to: "error_probe#conflict" }
      get "/probe/conflict", headers: EN

      assert_error_format :conflict, "Operation not allowed: the resource is linked to other data."
    end
  end

  # --- 500 ---

  test "unexpected errors return 500 in the standard format without technical details" do
    with_routing do |set|
      set.draw { get "probe/internal_error", to: "error_probe#internal_error" }
      get "/probe/internal_error", headers: EN

      assert_error_format :internal_server_error, "An internal server error occurred."
      assert_not_includes response.body, "dettaglio tecnico"
    end
  end
end
