class Api::V1::Admin::CategoriesController < Api::V1::AdminController
  before_action :set_category, only: [ :show, :update, :destroy ]

  # GET /admin/categories
  def index
    categories = Category.all.order(name: :asc)
    categories = search_by_name(categories) if params[:q].present?

    @pagy, @categories = pagy(categories, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@categories, CategorySerializer),
      meta: @pagy.data_hash
    )
  end

  # GET /admin/categories/:id
  def show
    render_success(
      data: serialize_resource(@category, CategorySerializer)
    )
  end

  # POST /admin/categories
  def create
    @category = Category.new(category_params)
    if @category.save
      # render json: @category, status: :created
      render_success(
        message: I18n.t("api.messages.category_created_successfully", name: @category.name),
        data: serialize_resource(@category, CategorySerializer),
        status: :created
      )
    else
      # render json: @category.errors, status: :unprocessable_content
      render_error(
        message: :category_create_error,
        errors: @category.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PUT /admin/categories/:id
  def update
    if @category.update(category_params)
      render_success(
        message: I18n.t("api.messages.category_updated_successfully", name: @category.name),
        data: serialize_resource(@category, CategorySerializer)
      )
    else
      render_error(
        message: :category_update_error,
        errors: @category.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/categories/:id
  def destroy
    # Una categoria con prodotti non si elimina (restrict_with_error): 409 con il motivo.
    if @category.destroy
      render_success(
        message: I18n.t("api.messages.category_deleted_successfully", name: @category.name)
      )
    else
      render_error(
        message: I18n.t("api.messages.category_delete_error", name: @category.name),
        errors: @category.errors.full_messages,
        status: :conflict
      )
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
