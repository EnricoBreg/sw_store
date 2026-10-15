require "test_helper"

class OrderTest < ActiveSupport::TestCase
  def build_order(**attributes)
    users(:customer).orders.build(
      {
        first_name: "Carlo",
        last_name: "Cliente",
        street: "Via Roma 1",
        city: "Milano",
        zip_code: "20100",
        country: "Italia",
        stripe_payment_token: "tok_test",
        total_amount: 100
      }.merge(attributes)
    )
  end

  test "valid order is saved as pending with a generated code" do
    order = build_order
    assert order.save, order.errors.full_messages.to_sentence

    assert order.pending?
    assert_match(/\AORD-#{Time.current.year}-\d{5}\z/, order.code)
  end

  test "sequence number grows within the same year" do
    first = build_order
    first.save!
    second = build_order
    second.save!

    assert_equal first.sequence_number + 1, second.sequence_number
  end

  test "requires the customer and shipping fields" do
    order = Order.new(user: users(:customer), total_amount: 10)
    assert_not order.valid?

    %i[first_name last_name street city country zip_code stripe_payment_token].each do |field|
      assert order.errors.of_kind?(field, :blank), "#{field} should be required"
    end
  end

  test "rejects a negative total" do
    order = build_order(total_amount: -1)
    assert_not order.valid?
    assert order.errors.of_kind?(:total_amount, :greater_than_or_equal_to)
  end

  test "shipping data cannot change once the order is shipped" do
    order = orders(:customer_shipped)

    assert_not order.update(city: "Torino")
    assert order.errors.of_kind?(:base, :not_editable)
  end

  test "shipping data can change while the order is pending" do
    order = orders(:customer_pending)

    assert order.update(city: "Torino")
  end

  test "allows the transitions of the order lifecycle" do
    order = orders(:customer_pending)

    %i[paid shipped delivered refunded].each do |status|
      assert order.update(status: status), "transition to #{status} should be allowed"
    end
  end

  test "rejects a status transition that skips the lifecycle" do
    order = orders(:customer_pending)

    assert_not order.update(status: :delivered)
    assert order.errors.of_kind?(:status, :invalid_transition)
    assert_equal "pending", order.reload.status
  end

  test "rejects an unknown status with a validation error" do
    order = orders(:customer_pending)

    assert_not order.update(status: "lost")
    assert order.errors.of_kind?(:status, :inclusion)
  end

  test "only pending and paid orders are cancellable" do
    assert orders(:customer_pending).cancellable?
    assert_not orders(:customer_shipped).cancellable?
  end

  test "cancel restores the stock of the ordered products" do
    order = orders(:customer_pending)

    assert_difference -> { products(:headphones).reload.stock_quantity }, 2 do
      assert order.cancel
    end
    assert order.reload.cancelled?
  end

  test "cancel is refused for shipped orders and leaves the stock untouched" do
    order = orders(:customer_shipped)

    assert_no_difference -> { products(:keyboard).reload.stock_quantity } do
      assert_not order.cancel
    end
    assert order.errors.of_kind?(:status, :invalid_transition)
    assert order.reload.shipped?
  end

  test "a cancelled order cannot be cancelled again" do
    order = orders(:customer_pending)
    order.cancel

    assert_no_difference -> { products(:headphones).reload.stock_quantity } do
      assert_not order.cancel
    end
  end
end
