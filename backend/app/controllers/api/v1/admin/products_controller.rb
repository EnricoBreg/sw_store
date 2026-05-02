class Api::V1::Admin::ProductsController < Api::V1::AdminController
  before_action :set_product, only: %i[ show update destroy ]

  # GET /admin/products
  def index
    # TODO: implementare filtri
    products = Product.all.order(created_at: :desc)
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
        message: "Prodotto #{@product.name} creato con successo",
        data: serialize_resource(@product, ProductSerializer),
        status: :created
      )
    else
      render_error(
        message: "Errore nella creazione del nuovo prodotto.",
        errors: @product.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PATCH/PUT /admin/products/1
  def update
    if @product.update(product_params)
      render_success(
        message: "Prodotto aggiornato con successo",
        data: serialize_resource(@product, ProductSerializer),
        status: :created
      )
    else
      render_error(
        message: "Errore nella creazione del nuovo prodotto.",
        errors: @product.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/products/1
  def destroy
    @product.destroy!
    render_success(
      message: "Prodotto #{@product.name} eliminato con successo.",
      status: :ok
    )
  end

  private

  def set_product
    @product = Product.find(params.expect(:id))
  end

  def product_params
    params.expect(product: [ :name, :description, :price, :discount_percentage, :stock_quantity, :active, :category_id ])
  end

  def search_by_name(scope)
    scope.where("name ILIKE ?", "%#{params[:q]}%")
  end
end
