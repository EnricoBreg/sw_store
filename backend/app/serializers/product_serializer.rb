class ProductSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :discount_percentage, :price, :stock_quantity

  attribute :image_url do |product|
    product.image.attached? ? Rails.application.routes.url_helpers.url_for(product.image) : nil
  end

  attribute :thumbnail_url do |product|
    product.image.attached? ? Rails.application.routes.url_helpers.url_for(product.image.variant(:thumb)) : nil
  end

  attribute :category do |product|
    CategorySerializer.new(product.category).serializable_hash[:data][:attributes]
  end
end
