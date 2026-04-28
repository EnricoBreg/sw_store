class CategoriesController < ApplicationController
  def index
    categories = Category.all.order(name: :asc)
    categories = search_by_name(categories) if params[:q].present?

    @pagy, @categories = pagy(categories, page: params[:page], items: params[:limit])

    render json: {
      data: @categories,
      meta: @pagy.data_hash
    }
  end

  def show
    @category = Category.find(params[:id])
    render json: @category
  end
end
