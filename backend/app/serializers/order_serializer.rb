class OrderSerializer
  include JSONAPI::Serializer
  attributes :id, :street, :city, :zip_code, :country, :total_amount, :stripe_payment_token, :status, :created_at, :updated_at

  attribute :user do |order|
    UserSerializer.new(order.user).serializable_hash[:data][:attributes]
  end

  attribute :items do |order|
    order.order_items.map do |item|
      OrderItemSerializer.new(item).serializable_hash[:data][:attributes]
    end
  end
end
