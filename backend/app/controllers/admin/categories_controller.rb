class Admin::CategoriesController < ApplicationController
  before_action :authenticate_user!

  # GET /admin/categories
  def index
    @categories = Category.all
    render json: @categories
  end

  # GET /admin/categories/:id
  def show
    @category = Category.find(params[:id])
    if category.nil?
      render json: { error: "Categoria non trovata" }, status: :not_found
    else
      render json: @category
    end
  end

  # DELETE /admin/categories/:id
  def destroy
    @category = Category.find(params[:id])
    if @category.nil?
      render json: { error: "Categoria non trovata" }, status: :not_found
    else
      @category.destroy!
      head :no_content
    end
  end
end
