class Address < ApplicationRecord
  belongs_to :user

  validates :first_name, :last_name, :street, :city, :zip_code, :country, presence: true
  # Nickname serve per distringuere tra più indirizzi (casa, lavoro, ecc...)
  validates :nickname, presence: true, uniqueness: { scope: :user_id }
end
