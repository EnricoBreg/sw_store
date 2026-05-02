class Api::V1::ProductsController < Api::V1::BaseController
  # GET /products
  def index
    products = Product.all.order(name: :asc)
    products = search_by_name(products) if params[:q].present?

    @pagy, @products = pagy(products, page: params[:page], items: params[:limit])

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
