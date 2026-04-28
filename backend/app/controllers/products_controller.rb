class ProductsController < ApplicationController
  # GET /products
  def index
    products = Product.all.order(name: :asc)
    products = search_by_name(products) if params[:q].present?

    @pagy, @products = pagy(products, page: params[:page], items: params[:limit])

    render json: {
      data: @products,
      meta: @pagy.data_hash
    }
  end

  # GET /products/id
  def show
    @product = Product.find(params[:id])
    render json: @product
  end

  private

  def search_by_name(products)
    products.where("name ILIKE ?", "%#{params[:q]}%")
  end
end
