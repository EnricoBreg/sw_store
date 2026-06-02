class WishlistItemSerializer
  include JSONAPI::Serializer
  attributes :id, :wishlist_id

  attribute :product do |wishlist_item|
    ProductSerializer.new(wishlist_item.product).serializable_hash[:data][:attributes]
  end
end
