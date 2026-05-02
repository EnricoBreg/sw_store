class Api::V1::Users::CartsController < Api::V1::AuthenticatedController
  before_action :set_product, only: [ :add_product, :remove_product ]

  # GET /api/v1/cart
  def show
    render_success(
      data: serialize_resource(current_user.cart, CartSerializer)
    )
  end

  def add_product
    current_user.cart.add(@product)
    if current_user.cart.save
      render_success(
        message: I18n.t("api.messages.added_to_cart", name: @product.name),
        data: serialize_resource(current_user.cart, CartSerializer)
      )
    else
      render_error(
        message: I18n.t("api.messages.add_to_cart_error", name: @product.name),
        errors: current_user.cart.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def remove_product
    current_user.cart.remove(@product)
    if current_user.cart.save
      render_success(
        message: I18n.t("api.messages.removed_from_cart", name: @product.name),
        data: serialize_resource(current_user.cart, CartSerializer)
      )
    else
      render_error(
        message: I18n.t("api.messages.remove_from_cart_error", name: @product.name),
        errors: current_user.cart.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_product
    @product = Product.find(params[:product_id])
  end
end
