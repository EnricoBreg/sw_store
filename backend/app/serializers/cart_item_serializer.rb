class CartItemSerializer
  include JSONAPI::Serializer
  attributes :id, :cart_id, :product_id, :quantity, :discount_percentage, :discounted_unit_price, :total_price

  # Prezzo di listino attuale del prodotto (non scontato).
  attribute :unit_price do |cart_item|
    cart_item.product.price
  end

  attribute :product do |cart_item|
    ProductSerializer.new(cart_item.product).serializable_hash[:data][:attributes]
  end
end
