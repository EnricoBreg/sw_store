class OrderItemSerializer
  include JSONAPI::Serializer
  attributes :id, :order_id, :unit_price, :quantity

  attribute :product do |order_item|
    ProductSerializer.new(order_item.product).serializable_hash[:data][:attributes]
  end
end
