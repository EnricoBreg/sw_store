class Order < ApplicationRecord
  before_validation :editable?, on: :update

  belongs_to :user

  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items

  enum :status, {
    pending: "pending", # status di default, l'ordine è stato creato ma non ancora pagato
    paid: "paid", # l'ordine è stato pagato ed è in preparazione
    shipped: "shipped", # l'ordione è stato affidato al corriere ed è in transito
    delivered: "delivered", # l'ordine è stato consegnato al cliente
    cancelled: "cancelled", # l'ordine è stato cancellato prima del pagamento
    refunded: "refunded" # l'ordine è stato rimborsato per un reso o un reclamo
  }, default: "pending"

  validates :street, :city, :country, :zip_code, :stripe_payment_token, presence: true
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  validate :must_be_editable, on: :update

  private

  # Metodo di validazione personalizzato per impedire la modifica di campi che non sono
  # status o updated_at se l'ordine non è più editabile.
  def must_be_editable
    return if editable?

    disallowed_changes = changes.keys - [ "status", "updated_at" ]
    if disallowed_changes.any?
      errors.add(:base, "Non è possibile modificare i dettaglio di un ordine già elaborato (Campi bloccati: #{disallowed_changes.join(", ")})")
    end
  end

  # Metodo per verificare se l'ordine è ancora modificabile.
  def editable?
    pending? || paid?
  end
end
