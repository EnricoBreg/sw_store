class CartSerializer
  include JSONAPI::Serializer

  attributes :id, :user_id

  attribute :items do |cart|
    cart.cart_items.map do |item|
      CartItemSerializer.new(item).serializable_hash[:data][:attributes].merge(id: item.id)
    end
  end
end
