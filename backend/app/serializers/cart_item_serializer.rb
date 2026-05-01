class CartItemSerializer
  include JSONAPI::Serializer
  attributes :id, :cart_id, :quantity, :unit_price

  attribute :product do |cart_item|
    ProductSerializer.new(cart_item.product).serializable_hash[:data][:attributes]
  end
end
