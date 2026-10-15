class Order < ApplicationRecord
  # Transizioni di stato consentite: ogni stato indica gli stati raggiungibili.
  STATUS_TRANSITIONS = {
    "pending" => %w[paid cancelled],
    "paid" => %w[shipped cancelled refunded],
    "shipped" => %w[delivered refunded],
    "delivered" => %w[refunded],
    "cancelled" => [],
    "refunded" => []
  }.freeze

  before_validation :generate_code, on: :create
  before_update :restore_stock, if: -> { will_save_change_to_status?(to: "cancelled") }

  belongs_to :user

  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items

  enum :status, {
    pending: "pending", # status di default, l'ordine è stato creato ma non ancora pagato
    paid: "paid", # l'ordine è stato pagato ed è in preparazione
    shipped: "shipped", # l'ordione è stato affidato al corriere ed è in transito
    delivered: "delivered", # l'ordine è stato consegnato al cliente
    cancelled: "cancelled", # l'ordine è stato annullato prima della spedizione
    refunded: "refunded" # l'ordine è stato rimborsato per un reso o un reclamo
  }, default: "pending", validate: true

  validates :first_name, :last_name, :street, :city, :country, :zip_code, :stripe_payment_token, presence: true
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  validate :must_be_editable, on: :update
  validate :status_transition_must_be_allowed, on: :update

  # Un ordine si può annullare solo prima della spedizione.
  def cancellable?
    STATUS_TRANSITIONS.fetch(status_in_database, []).include?("cancelled")
  end

  # Annulla l'ordine (lo stock viene ripristinato da restore_stock). Il lock sulla riga
  # impedisce che due richieste concorrenti ripristinino lo stock due volte.
  def cancel
    with_lock do
      # Il controllo esplicito serve anche per gli ordini già annullati, dove update non vedrebbe alcuna modifica.
      unless cancellable?
        errors.add(:status, :invalid_transition, from: status, to: "cancelled")
        next false
      end

      update(status: :cancelled)
    end
  end

  private

  # Metodo di validazione personalizzato per impedire la modifica di campi che non sono
  # status o updated_at se l'ordine non è più editabile.
  def must_be_editable
    return if editable?

    disallowed_changes = changes.keys - [ "status", "updated_at" ]
    if disallowed_changes.any?
      errors.add(:base, :not_editable, fields: disallowed_changes.join(", "))
    end
  end

  def status_transition_must_be_allowed
    return unless will_save_change_to_status? && self.class.statuses.key?(status)
    return if STATUS_TRANSITIONS.fetch(status_in_database, []).include?(status)

    errors.add(:status, :invalid_transition, from: status_in_database, to: status)
  end

  # L'ordine è modificabile finché, prima di questo salvataggio, era in attesa o pagato.
  def editable?
    %w[pending paid].include?(status_in_database)
  end

  # All'annullamento la merce torna disponibile. Il callback gira nella transazione del salvataggio
  # e update_counters esegue un UPDATE atomico, quindi non ci sono letture concorrenti dello stock.
  def restore_stock
    order_items.each do |item|
      Product.update_counters(item.product_id, stock_quantity: item.quantity)
    end
  end

  def generate_code
    # Genera un codice univoco per l'ordine, combinando un prefisso, un numero sequenziale e un timestamp.
    # Il numero sequenziale viene calcolato come il numero di ordini esistenti + 1, garantendo così l'unicità del codice.

    current_date = self.created_at || Time.current
    current_year = current_date.year

    start_of_year = current_date.beginning_of_year
    end_of_year = current_date.end_of_year

    Order.transaction do
      last_order = Order.where(created_at: start_of_year..end_of_year)
                        .order(sequence_number: :desc)
                        .lock("FOR UPDATE")
                        .first

      last_sequence = last_order ? last_order.sequence_number : 0
      self.sequence_number = last_sequence + 1
    end

    self.code = "ORD-#{current_year}-#{sprintf("%05d", self.sequence_number)}"
  end
end
