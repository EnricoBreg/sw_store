class Api::V1::Users::CartsController < Api::V1::AuthenticatedController
  # GET /api/v1/cart
  def show
    render_success(
      data: serialize_resource(current_user.cart, CartSerializer)
    )
  end
end
