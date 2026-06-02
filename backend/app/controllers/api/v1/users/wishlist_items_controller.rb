class Api::V1::Users::WishlistItemsController < Api::V1::AuthenticatedController
  before_action :set_wishlist
  before_action :set_product, only: [ :destroy, :move_to_cart ]

  def create
    product_id = wishlist_item_params[:product_id]
    product = Product.find(product_id)

    Rails.logger.debug product.inspect

    if @wishlist.products.include?(product)
      message = I18n.t("api.messages.already_in_wishlist", name: product.name)

      render_error(
        message: message,
        errors: [ message ],
        status: :unprocessable_entity
      )
      return
    end

    @wishlist.wishlist_items << WishlistItem.new(product: product)
    if @wishlist.save
      render_success(
        message: I18n.t("api.messages.added_to_wishlist", name: product.name),
        data: serialize_resource(@wishlist, WishlistSerializer)
      )
    else
      render_error(
        message: I18n.t("api.messages.add_to_wishlist_error", name: product.name),
        errors: @wishlist.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PUT /api/v1/wishlist/items/:product_id/move
  def move_to_cart
    unless @wishlist.products.include?(@product)
      message = I18n.t("api.messages.product_not_in_wishlist", name: @product.name)

      render_error(
        message: message,
        errors: [ message ],
        status: :not_found
      )
      return
    end

    cart_item = current_user.cart.cart_items.find_by(product_id: @product.id)
    if cart_item
      cart_item.quantity += 1
    else
      cart_item = current_user.cart.cart_items.build(product: @product, quantity: 1, unit_price: @product.price)
    end

    if cart_item.save
      @wishlist.wishlist_items.find_by(product_id: @product.id).destroy
      @wishlist.save

      render_success(
        message: I18n.t("api.messages.added_to_cart", name: @product.name),
        data: serialize_resource(current_user.cart, CartSerializer),
        status: :created
      )
    else
      render_error(
        message: I18n.t("api.messages.add_to_cart_error", name: @product.name),
        errors: cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /api/v1/wishlist/items/:product_id
  def destroy
    unless @wishlist.products.include?(@product)
      message = I18n.t("api.messages.product_not_in_wishlist", name: @product.name)

      render_error(
        message: message,
        errors: [ message ],
        status: :not_found
      )
      return
    end

    @wishlist.products.delete(@product)
    if @wishlist.save
      render_success(
        message: I18n.t("api.messages.removed_from_wishlist", name: @product.name),
        data: serialize_resource(@wishlist, WishlistSerializer)
      )
    else
      render_error(
        message: I18n.t("api.messages.remove_from_wishlist_error", name: @product.name),
        errors: @wishlist.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_wishlist
    @wishlist = current_user.wishlist
  end

  def set_product
    @product = Product.find(params[:product_id])
  end

  def wishlist_item_params
    params.expect(wishlist_item: [ :product_id ])
  end
end
