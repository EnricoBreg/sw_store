class Api::V1::CategoriesController < Api::V1::BaseController
  def index
    categories = Category.all.order(name: :asc)
    categories = search_by_name(categories) if params[:q].present?

    @pagy, @categories = pagy(categories, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@categories, CategorySerializer),
      meta: @pagy.data_hash
    )
  end

  def show
    @category = Category.find(params[:id])
    render_success(
      data: serialize_resource(@category, CategorySerializer)
    )
  end
end
