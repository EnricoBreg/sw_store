class Api::V1::Users::WishlistsController < Api::V1::AuthenticatedController
  # GET /api/v1/wishlist
  def show
    render_success(
      data: serialize_resource(current_user.wishlist, WishlistSerializer)
    )
  end
end
