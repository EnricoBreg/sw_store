class Wishlist < ApplicationRecord
  belongs_to :user

  has_many :wishlist_items, dependent: :destroy
  has_many :products, through: :wishlist_items

  def empty?
    wishlist_items.empty?
  end
end
