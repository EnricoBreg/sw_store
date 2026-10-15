class OrderItemSerializer
  include JSONAPI::Serializer
  attributes :id, :order_id, :unit_price, :quantity, :discount_percentage

  # unit_price è già il prezzo scontato pagato: discount_percentage è solo informativo.
  attribute :total_price do |order_item|
    order_item.unit_price * order_item.quantity
  end

  attribute :product do |order_item|
    ProductSerializer.new(order_item.product).serializable_hash[:data][:attributes]
  end
end
