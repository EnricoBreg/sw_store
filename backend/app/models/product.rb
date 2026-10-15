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

  IMAGE_CONTENT_TYPES = %w[image/jpeg image/png image/webp].freeze
  IMAGE_MAX_SIZE = 5.megabytes

  attribute :active, :boolean, default: true

  scope :active, -> { where(active: true) }

  validates :name, presence: true
  validates :description, presence: true, length: { minimum: 10 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :discount_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :stock_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :active, inclusion: { in: [ true, false ] }
  validate :image_must_be_valid, if: -> { attachment_changes["image"].present? && image.attached? }
  # validates :category, presence: true

  private

  def image_must_be_valid
    unless IMAGE_CONTENT_TYPES.include?(uploaded_image_content_type)
      errors.add(:image, :invalid_content_type, allowed: "JPEG, PNG, WebP")
    end
    if image.blob.byte_size > IMAGE_MAX_SIZE
      errors.add(:image, :too_large, max: "#{IMAGE_MAX_SIZE / 1.megabyte} MB")
    end
  end

  # Tipo ricavato solo dal contenuto del file (magic bytes): Active Storage, se il contenuto non è
  # riconoscibile, ripiega su estensione e Content-Type dichiarati, che il client può falsificare.
  def uploaded_image_content_type
    attachable = attachment_changes["image"].attachable
    io = attachable.is_a?(Hash) ? attachable[:io] : attachable.try(:to_io)
    return image.blob.content_type unless io

    Marcel::MimeType.for(io).tap { io.rewind }
  end
end
