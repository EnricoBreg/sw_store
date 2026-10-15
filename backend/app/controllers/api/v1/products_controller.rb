class Api::V1::ProductsController < Api::V1::BaseController
  SORTABLE_COLUMNS = %w[name price created_at].freeze

  # GET /products
  # Il catalogo pubblico mostra solo i prodotti attivi.
  def index
    products = apply_sorting(Product.active, allowed: SORTABLE_COLUMNS, default: { name: :asc })
    products = products.where(category_id: params[:category_id]) if params[:category_id].present?
    products = search_by_name(products) if params[:q].present?

    @pagy, @products = pagy(products, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@products, ProductSerializer),
      meta: @pagy.data_hash
    )
  end

  # GET /products/id
  def show
    @product = Product.active.find(params[:id])
    render_success(
      data: serialize_resource(@product, ProductSerializer)
    )
  end
end
