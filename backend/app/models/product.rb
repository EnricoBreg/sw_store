class Product < ApplicationRecord
  belongs_to :category

  has_one_attached :image do |attachable|
    attachable.variant :thumb, resize_to_limit: [ 100, 100 ]
  end

  has_many :cart_items, dependent: :destroy
  has_many :carts, through: :cart_items
  has_many :wishlist_items, dependent: :destroy
  # Un prodotto già ordinato non si elimina (lo storico degli ordini lo referenzia): si disattiva.
  has_many :order_items, dependent: :restrict_with_error

  attribute :active, :boolean, default: true

  scope :active, -> { where(active: true) }

  validates :name, presence: true
  validates :description, presence: true, length: { minimum: 10 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :discount_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :stock_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :active, inclusion: { in: [ true, false ] }
  # validates :category, presence: true
end
