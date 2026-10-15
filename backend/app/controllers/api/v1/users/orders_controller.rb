class Api::V1::Users::OrdersController < Api::V1::AuthenticatedController
  include OrderStatusFilter

  before_action :set_order, only: [ :show, :update, :destroy ]

  def index
    orders = filter_by_status(current_user.orders.order(created_at: :desc))

    @pagy, @orders = pagy(orders, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@orders, OrderSerializer),
      meta: @pagy.data_hash
    )
  end

  # GET /api/v1/orders/:id
  def show
    render_success(
      data: serialize_resource(@order, OrderSerializer)
    )
  end

  # POST /api/v1/orders
  def create
    cart = current_user.cart

    if cart.empty?
      message = I18n.t("api.messages.checkout_empty_cart")
      render_error(message: message, errors: [ message ], status: :unprocessable_entity)
      return
    end

    @order = Order.create_from_cart(cart, order_params)

    if @order.persisted?
      render_success(
        message: I18n.t("api.messages.checkout_successful", id: @order.id),
        data: serialize_resource(@order, OrderSerializer),
        status: :created
      )
    else
      render_error(
        message: :checkout_error,
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # PUT /api/v1/orders/:id
  def update
    if @order.update(order_params)
      render_success(
        message: I18n.t("api.messages.order_updated_successfully", id: @order.id),
        data: serialize_resource(@order, OrderSerializer)
      )
    else
      render_error(
        message: I18n.t("api.messages.order_update_error", id: @order.id),
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /api/v1/orders/:id
  def destroy
    # Per il delete, si considera solamente la cancellazione soft dell'ordine, impostando lo status a "cancelled".
    # In questo modo, si mantiene comunque traccia dell'ordine e dei suoi item, evitando di cancellare dati importanti.
    # L'annullamento è consentito solo prima della spedizione e ripristina lo stock dei prodotti.
    if @order.cancel
      render_success(
        message: I18n.t("api.messages.order_deleted_successfully", id: @order.id),
      )
    else
      render_error(
        message: I18n.t("api.messages.order_delete_error", id: @order.id),
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  # La ricerca è limitata agli ordini dell'utente corrente: gli ordini altrui risultano inesistenti (404).
  def set_order
    @order = current_user.orders.find(params[:id])
  end

  def order_params
    params.expect(order: [ :first_name, :last_name, :street, :city, :zip_code, :country, :stripe_payment_token ])
  end
end
