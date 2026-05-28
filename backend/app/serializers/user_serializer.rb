class UserSerializer
  include JSONAPI::Serializer
  attributes :id, :email, :first_name, :last_name, :number, :admin

  attribute :created_at do |user|
    user.created_at && user.created_at.strftime("%d/%m/%Y")
  end

  attribute :date_of_birth do |user|
    user.date_of_birth && user.date_of_birth.strftime("%d/%m/%Y")
  end

  attribute :orders_count do |user|
    user.orders.size
  end

  attribute :last_order_date do |user|
    last_order = user.orders.last
    last_order ? last_order.created_at.strftime("%d/%m/%Y") : nil
  end

  attribute :addresses_count do |user|
    user.addresses.size
  end
end
