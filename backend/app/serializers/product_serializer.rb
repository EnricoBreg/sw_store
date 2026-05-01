class ProductSerializer
  include JSONAPI::Serializer
  attributes :id, :name, :description, :discount_percentage, :price, :stock_quantity, :image_url

  attribute :category do |product|
    CategorySerializer.new(product.category).serializable_hash[:data][:attributes]
  end
end
