class AddressSerializer
  include JSONAPI::Serializer
  attributes :id, :nickname, :first_name, :last_name, :street, :city, :zip_code, :country, :is_default
end
