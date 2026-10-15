require "test_helper"

class Api::V1::Users::WishlistItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @customer = users(:customer)
    @product = products(:keyboard)
    wishlists(:customer_wishlist).wishlist_items.create!(product: @product)
  end

  def move_to_cart
    put "/api/v1/wishlist/items/#{@product.id}/move", headers: auth_headers(@customer), as: :json
  end

  test "PUT /wishlist/items/:product_id/move moves the product into the cart" do
    move_to_cart

    assert_response :created
    assert_equal 1, @customer.cart.cart_items.find_by(product: @product).quantity
    assert_not wishlists(:customer_wishlist).products.include?(@product)
  end

  test "PUT /wishlist/items/:product_id/move applies the cart availability rules" do
    @product.update_columns(active: false)

    move_to_cart

    assert_response :unprocessable_entity
    assert_nil @customer.cart.cart_items.find_by(product: @product)
    assert wishlists(:customer_wishlist).products.include?(@product)
  end
end
