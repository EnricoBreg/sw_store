class Api::V1::ProductsController < Api::V1::BaseController
  # GET /products
  def index
    products = Product.all.order(name: :asc)
    products = search_by_name(products) if params[:q].present?

    page_param = params[:page].to_i
    current_page = page_param > 0 ? page_param : 0

    @pagy, @products = pagy(products, page: current_page + 1, items: params[:limit])

    render_success(
      data: serialize_collection(@products, ProductSerializer),
      meta: @pagy.data_hash
    )
  end

  # GET /products/id
  def show
    @product = Product.find(params[:id])
    render_success(
      data: serialize_resource(@product, ProductSerializer)
    )
  end

  private

  def search_by_name(products)
    products.where("name ILIKE ?", "%#{params[:q]}%")
  end
end
