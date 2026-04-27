class UserSerializer
  include JSONAPI::Serializer
  attributes :id, :email, :first_name, :last_name, :number, :admin

  attribute :created_at do |user|
    user.created_at && user.created_at.strftime("%d/%m/%Y")
  end

  attribute :date_of_birth do |user|
    user.date_of_birth && user.date_of_birth.strftime("%d/%m/%Y")
  end
end
