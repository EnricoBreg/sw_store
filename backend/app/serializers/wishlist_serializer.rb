class WishlistSerializer
  include JSONAPI::Serializer
  attributes :id, :user_id

  attribute :items do |wishlist|
    wishlist.products.map do |product|
      ProductSerializer.new(product).serializable_hash[:data][:attributes]
    end
  end
end
