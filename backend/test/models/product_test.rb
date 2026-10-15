require "test_helper"

class ProductTest < ActiveSupport::TestCase
  setup do
    @product = products(:headphones)
  end

  test "fixture is valid" do
    assert @product.valid?
  end

  test "requires a name" do
    @product.name = ""
    assert_not @product.valid?
    assert @product.errors.added?(:name, :blank)
  end

  test "requires a description of at least 10 characters" do
    @product.description = "Corta"
    assert_not @product.valid?
    assert @product.errors.of_kind?(:description, :too_short)
  end

  test "requires a category" do
    @product.category = nil
    assert_not @product.valid?
    assert @product.errors.of_kind?(:category, :blank)
  end

  test "rejects a negative price" do
    @product.price = -1
    assert_not @product.valid?
    assert @product.errors.of_kind?(:price, :greater_than_or_equal_to)
  end

  test "rejects a negative stock quantity" do
    @product.stock_quantity = -5
    assert_not @product.valid?
    assert @product.errors.of_kind?(:stock_quantity, :greater_than_or_equal_to)
  end

  test "accepts a discount between 0 and 100 or nil" do
    [ 0, 50, 100, nil ].each do |value|
      @product.discount_percentage = value
      assert @product.valid?, "discount_percentage #{value.inspect} should be valid"
    end
  end

  test "rejects a discount outside 0..100" do
    [ -1, 101 ].each do |value|
      @product.discount_percentage = value
      assert_not @product.valid?, "discount_percentage #{value.inspect} should be invalid"
    end
  end
end
