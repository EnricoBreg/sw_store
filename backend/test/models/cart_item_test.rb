require "test_helper"

class CartItemTest < ActiveSupport::TestCase
  setup do
    @item = cart_items(:customer_headphones)
  end

  test "fixture is valid" do
    assert @item.valid?
  end

  test "quantity must be a positive integer" do
    [ 0, -1, 1.5, "abc", nil ].each do |value|
      @item.quantity = value
      assert_not @item.valid?, "quantity #{value.inspect} should be invalid"
      assert @item.errors.include?(:quantity)
    end
  end

  test "unit_price cannot be negative" do
    @item.unit_price = -1
    assert_not @item.valid?
    assert @item.errors.of_kind?(:unit_price, :greater_than_or_equal_to)
  end

  test "the same product cannot appear twice in a cart" do
    duplicate = @item.cart.cart_items.build(product: @item.product, quantity: 1, unit_price: 1)
    assert_not duplicate.valid?
    assert duplicate.errors.of_kind?(:product_id, :taken)
  end

  test "an inactive product is not available" do
    @item.product.active = false
    assert_not @item.valid?
    assert @item.errors.of_kind?(:base, :product_not_available)
  end

  test "quantity cannot exceed the stock" do
    @item.quantity = @item.product.stock_quantity + 1
    assert_not @item.valid?
    assert @item.errors.of_kind?(:quantity, :insufficient_stock)

    @item.quantity = @item.product.stock_quantity
    assert @item.valid?
  end

  test "prices follow the current price and discount of the product" do
    assert_equal BigDecimal("89.91"), @item.discounted_unit_price
    assert_equal BigDecimal("179.82"), @item.total_price

    @item.product.discount_percentage = nil
    assert_equal BigDecimal("99.9"), @item.discounted_unit_price
  end
end
