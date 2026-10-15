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
    order = build_order
    order.save!
    order.update!(status: :shipped)

    assert_not order.update(city: "Torino")
    assert order.errors[:base].any?
  end
end
