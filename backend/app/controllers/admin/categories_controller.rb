class Admin::CategoriesController < Admin::BaseController
  before_action :set_category, only: [ :show, :update, :destroy ]

  # GET /admin/categories
  def index
    @categories = Category.all
    render json: @categories
  end

  # GET /admin/categories/:id
  def show
    if @category.nil?
      render json: { error: "Categoria non trovata" }, status: :not_found
    else
      render json: @category, status: :ok
    end
  end

  # POST /admin/categories
  def create
    @category = Category.new(category_params)
    if @category.save
      render json: @category, status: :created
    else
      render json: @category.errors, status: :unprocessable_content
    end
  end

  # PUT /admin/categories/:id
  def update
    if @category.update(category_params)
      render json: @category, status: :ok
    else
      render json: @category.errors.full_messages, status: :unprocessable_entity
    end
  end

  # DELETE /admin/categories/:id
  def destroy
    if @category.nil?
      render json: { error: "Categoria non trovata" }, status: :not_found
    else
      @category.destroy!
      head :no_content
    end
  end

  private

  def set_category
    @category = Category.find(params[:id])
  end

  def category_params
    params.expect(category: [ :name, :description ])
  end
end
