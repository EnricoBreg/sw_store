class Api::V1::Users::CartItemsController < Api::V1::AuthenticatedController
  before_action :set_cart
  before_action :set_cart_item, only: [ :update, :destroy ]

  # POST /api/v1/cart/items
  def create
    product = Product.find(cart_item_params[:product_id])
    @cart_item = @cart.add_product(product, cart_item_params.fetch(:quantity, 1))

    if @cart_item.save
      render_success(
        message: I18n.t("api.messages.added_to_cart", name: product.name),
        data: serialized_cart,
        status: :created
      )
    else
      render_error(
        message: I18n.t("api.messages.add_to_cart_error", name: product.name),
        errors: @cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PATCH/PUT /api/v1/cart/items/:id
  def update
    product = @cart_item.product

    if @cart_item.update(quantity: cart_item_params[:quantity], unit_price: product.price)
      render_success(
        message: I18n.t("api.messages.quantity_updated", name: product.name),
        data: serialized_cart
      )
    else
      render_error(
        message: I18n.t("api.messages.quantity_update_error", name: product.name),
        errors: @cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /api/v1/cart/items/:id
  def destroy
    @cart_item.destroy!
    render_success(
      message: I18n.t("api.messages.removed_from_cart", name: @cart_item.product.name),
      data: serialized_cart
    )
  end

  private

  def set_cart
    @cart = current_user.cart
  end

  # La ricerca è limitata al carrello dell'utente corrente: le righe altrui risultano inesistenti (404).
  def set_cart_item
    @cart_item = @cart.cart_items.find(params[:id])
  end

  def cart_item_params
    params.expect(cart_item: [ :product_id, :quantity ])
  end

  def serialized_cart
    serialize_resource(@cart.reload, CartSerializer)
  end
end
