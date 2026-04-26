class UserSerializer
  include JSONAPI::Serializer
  attributes :id, :email, :name

  attribute :created_at do |user|
    user.created_at && user.created_at.strftime("%d/%m/%Y")
  end
end
