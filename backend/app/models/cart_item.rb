class CartItem < ApplicationRecord
  belongs_to :product
  belongs_to :cart

  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
  validates :unit_price, numericality: { greater_than_or_equal_to: 0 }
  validates :product_id, uniqueness: { scope: :cart_id }
  validate :product_must_be_available

  # I prezzi del carrello seguono sempre prezzo e sconto attuali del prodotto:
  # vengono fissati solo alla creazione dell'ordine (vedi Order.create_from_cart).
  def discount_percentage
    product.discount_percentage || 0
  end

  def discounted_unit_price
    (product.price * (1 - discount_percentage / 100)).round(2)
  end

  def total_price
    discounted_unit_price * quantity
  end

  private

  def product_must_be_available
    return if product.nil? || errors.include?(:quantity)

    if !product.active?
      errors.add(:base, :product_not_available, name: product.name)
    elsif quantity > product.stock_quantity
      errors.add(:quantity, :insufficient_stock, name: product.name, available: product.stock_quantity)
    end
  end
end
