class Admin::ProductsController < Admin::BaseController
  before_action :set_product, only: %i[ show update destroy ]

  # GET /admin/products
  def index
    # TODO: implementare filtri
    products = Product.all.order(created_at: :desc)

    products = search_by_name(products) if params[:q].present?
    products = products.where(category_id: params[:category_id]) if params[:category_id].present?

    # Pagy accetta la query e il parametro della pagina dalla request
    @pagy, @products = pagy(products, page: params[:page], items: params[:per_page])

    render json: {
      data: @products,
      meta: @pagy.data_hash # Generazione automatica dei campi: page, last, count, etc.
    }
  end

  # GET /admin/products/1
  def show
    render json: @product
  end

  # POST /admin/products
  def create
    @product = Product.new(product_params)

    if @product.save
      render json: @product, status: :created
    else
      render json: @product.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /admin/products/1
  def update
    if @product.update(product_params)
      render json: @product
    else
      render json: @product.errors, status: :unprocessable_content
    end
  end

  # DELETE /admin/products/1
  def destroy
    @product.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_product
      @product = Product.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def product_params
      params.expect(product: [ :name, :description, :price, :discount_percentage, :stock_quantity, :active ])
    end

    def search_by_name(scope)
      scope.where("name ILIKE ?", "%#{params[:q]}%")
    end
end
