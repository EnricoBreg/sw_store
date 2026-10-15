class Cart < ApplicationRecord
  belongs_to :user

  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  def empty?
    cart_items.empty?
  end

  # Prepara (senza salvarla) la riga del carrello per il prodotto: se esiste già, la quantità viene sommata.
  # Una quantità non valida (non intera o minore di 1) viene assegnata così com'è,
  # in modo che sia la validazione di CartItem a rifiutarla.
  def add_product(product, quantity)
    item = cart_items.find_or_initialize_by(product: product)
    amount = Integer(quantity.to_s, exception: false)

    item.quantity = item.persisted? && amount&.positive? ? item.quantity + amount : quantity
    item.unit_price = product.price
    item
  end

  def items_count
    cart_items.sum(&:quantity)
  end

  def total_amount
    # Valore iniziale decimale: anche il carrello vuoto ha un totale serializzato come stringa ("0.0").
    cart_items.sum(BigDecimal("0"), &:total_price)
  end
end
