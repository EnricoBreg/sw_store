require "test_helper"

class CartTest < ActiveSupport::TestCase
  setup do
    @cart = carts(:customer_cart)
  end

  test "add_product builds a new line with the current list price" do
    item = @cart.add_product(products(:keyboard), 3)

    assert item.new_record?
    assert_equal 3, item.quantity
    assert_equal products(:keyboard).price, item.unit_price
  end

  test "add_product sums the quantity of an existing line" do
    item = @cart.add_product(products(:headphones), 3)

    assert_equal cart_items(:customer_headphones), item
    assert_equal 5, item.quantity
  end

  test "add_product keeps an invalid quantity so that validation rejects it" do
    [ 0, -2, "abc" ].each do |value|
      assert_not @cart.add_product(products(:headphones), value).valid?, "quantity #{value.inspect} should be rejected"
    end
  end

  test "totals are computed from the lines" do
    @cart.add_product(products(:keyboard), 1).save!
    @cart.reload

    assert_equal 3, @cart.items_count
    assert_equal BigDecimal("179.82") + BigDecimal("79"), @cart.total_amount
  end
end
