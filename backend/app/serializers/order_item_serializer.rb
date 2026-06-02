class OrderItemSerializer
  include JSONAPI::Serializer
  attributes :id, :order_id, :unit_price, :quantity, :discount_percentage

  attribute :total_price do |order_item|
    order_item.unit_price * order_item.quantity * (1 - order_item.discount_percentage.to_f / 100)
  end

  attribute :product do |order_item|
    ProductSerializer.new(order_item.product).serializable_hash[:data][:attributes]
  end
end
