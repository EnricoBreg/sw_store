class WishlistSerializer
  include JSONAPI::Serializer
  attributes :id, :user_id

  attribute :items do |wishlist|
    wishlist.wishlist_items.map do |item|
      WishlistItemSerializer.new(item).serializable_hash[:data][:attributes]
    end
  end
end
