class Category < ApplicationRecord
  # Una categoria con prodotti non si elimina: i prodotti vanno prima spostati o eliminati.
  has_many :products, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end
