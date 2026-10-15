require "test_helper"

class Api::V1::Users::AddressesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @customer = users(:customer)
    @headers = auth_headers(@customer)
  end

  def address_payload(**overrides)
    {
      address: {
        nickname: "Ufficio",
        first_name: "Carlo",
        last_name: "Cliente",
        street: "Corso Italia 10",
        city: "Milano",
        zip_code: "20122",
        country: "Italia",
        is_default: false
      }.merge(overrides)
    }
  end

  test "GET /addresses lists only the addresses of the current user" do
    get api_v1_addresses_path, headers: @headers

    assert_response :ok
    data = json_response["data"]
    assert_equal [ addresses(:customer_home).id ], data.map { |address| address["id"] }
    assert_equal "Casa", data.first["nickname"]
    assert_equal "20100", data.first["zip_code"]
  end

  test "GET /addresses/:id of another user returns 404" do
    get api_v1_address_path(addresses(:other_customer_home)), headers: @headers

    assert_response :not_found
  end

  test "POST /addresses creates an address" do
    assert_difference -> { @customer.addresses.count }, 1 do
      post api_v1_addresses_path, params: address_payload, headers: @headers, as: :json
    end

    assert_response :created
    assert_equal "Ufficio", json_response["data"]["nickname"]
  end

  test "POST /addresses with a duplicated nickname returns 422" do
    assert_no_difference -> { Address.count } do
      post api_v1_addresses_path, params: address_payload(nickname: "Casa"), headers: @headers, as: :json
    end

    assert_response :unprocessable_entity
    assert json_response["errors"].any?
  end

  test "PUT /addresses/:id updates an own address" do
    address = addresses(:customer_home)
    put api_v1_address_path(address), params: { address: { city: "Bergamo" } }, headers: @headers, as: :json

    assert_response :ok
    assert_equal "Bergamo", address.reload.city
  end

  test "DELETE /addresses/:id removes an own address" do
    assert_difference -> { @customer.addresses.count }, -1 do
      delete api_v1_address_path(addresses(:customer_home)), headers: @headers
    end

    assert_response :ok
  end
end
