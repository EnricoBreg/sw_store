class Cart < ApplicationRecord
  belongs_to :user

  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  def empty?
    cart_items.empty?
  end

  def total_amount
    cart_items.sum { |item| (item.unit_price * (1 - item.product.discount_percentage.to_f / 100)) * item.quantity }
  end
end
