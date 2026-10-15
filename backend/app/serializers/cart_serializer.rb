class CartSerializer
  include JSONAPI::Serializer

  attributes :id, :user_id, :items_count, :total_amount

  attribute :items do |cart|
    cart.cart_items.includes(product: :category).order(:created_at, :id).map do |item|
      CartItemSerializer.new(item).serializable_hash[:data][:attributes]
    end
  end
end
