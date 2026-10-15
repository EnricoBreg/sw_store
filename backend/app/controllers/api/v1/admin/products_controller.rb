class Api::V1::Admin::ProductsController < Api::V1::AdminController
  SORTABLE_COLUMNS = %w[id name price discount_percentage stock_quantity active created_at updated_at].freeze

  before_action :set_product, only: %i[ show update destroy ]

  # GET /admin/products
  def index
    products = apply_sorting(Product.all, allowed: SORTABLE_COLUMNS, default: { created_at: :desc })
    products = search_by_name(products) if params[:q].present?
    products = products.where(category_id: params[:category_id]) if params[:category_id].present?

    # Pagy accetta la query e il parametro della pagina dalla request
    @pagy, @products = pagy(products, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@products, ProductSerializer),
      meta: @pagy.data_hash # Generazione automatica dei campi: page, last, count, etc.
    )
  end

  # GET /admin/products/1
  def show
    render_success(
      data: serialize_resource(@product, ProductSerializer)
    )
  end

  # POST /admin/products
  def create
    @product = Product.new(product_params)

    if @product.save
      render_success(
        message: I18n.t("api.messages.product_created_successfully", name: @product.name),
        data: serialize_resource(@product, ProductSerializer),
        status: :created
      )
    else
      render_error(
        message: :product_create_error,
        errors: @product.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PATCH/PUT /admin/products/1
  def update
    if @product.update(product_params)
      # product[remove_image]=true rimuove l'immagine (ignorato se nella stessa richiesta ne arriva una nuova)
      @product.image.purge if remove_image? && product_params[:image].blank? && @product.image.attached?
      render_success(
        message: I18n.t("api.messages.product_updated_successfully", name: @product.name),
        data: serialize_resource(@product, ProductSerializer)
      )
    else
      render_error(
        message: :product_update_error,
        errors: @product.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/products/1
  def destroy
    # Un prodotto presente in ordini non si elimina (restrict_with_error): 409 con il motivo.
    if @product.destroy
      render_success(
        message: I18n.t("api.messages.product_deleted_successfully", name: @product.name)
      )
    else
      render_error(
        message: I18n.t("api.messages.product_delete_error", name: @product.name),
        errors: @product.errors.full_messages,
        status: :conflict
      )
    end
  end

  private

  def set_product
    @product = Product.find(params.expect(:id))
  end

  # L'immagine arriva solo come file (multipart/form-data): un valore diverso, es. una stringa in JSON,
  # verrebbe interpretato da Active Storage come id firmato di un blob, quindi viene scartato.
  def product_params
    @product_params ||= params.expect(product: [ :name, :description, :price, :discount_percentage, :stock_quantity, :active, :category_id, :image, :remove_image ]).tap do |permitted|
      permitted.delete(:image) unless permitted[:image].is_a?(ActionDispatch::Http::UploadedFile)
      permitted.delete(:remove_image)
    end
  end

  def remove_image?
    ActiveModel::Type::Boolean.new.cast(params.dig(:product, :remove_image))
  end
end
