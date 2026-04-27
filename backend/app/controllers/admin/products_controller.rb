class Admin::ProductsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_product, only: %i[ show update destroy ]

  # GET /admin/products
  def index
    @products = Product.all

    render json: @products
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
end
