class Api::V1::Users::OrdersController < Api::V1::AuthenticatedController
  before_action :set_order, only: [ :show, :update, :destroy ]

  def index
    orders = current_user.orders.order(created_at: :desc)
    orders.where(status: params[:status]) if params[:status].present?

    @pagy, @orders = pagy(orders, page: params[:page], items: params[:limit])

    render json: {
      data: @orders.map { |order| OrderSerializer.new(order).serializable_hash[:data][:attributes] },
      meta: @pagy.data_hash
    }, status: :ok
  end

  # GET /api/v1/orders/:id
  def show
  end

  # POST /api/v1/orders
  def create
    cart = current_user.cart

    if cart.empty?
      render json: { error: "Il carrello è vuoto. Impossibile proseguire con il checkout" }, status: :unprocessable_entity
      return
    end

    ActiveRecord::Base.transaction do
      safe_params = new_order_params.merge(
        total_amount: cart.total_amount,
      )

      # Creazione dell'ordine
      @order = current_user.orders.create!(safe_params)

      # Conversione dei cart_item in order_item
      cart.cart_items.each do |cart_item|
        @order.order_items.create!(
          product: cart_item.product,
          quantity: cart_item.quantity,
          unit_price: cart_item.unit_price
        )
      end

      # Svuotamento del carrello
      cart.cart_items.destroy_all
    end

    render json: OrderSerializer.new(@order).serializable_hash[:data][:attributes], status: :created

  rescue ActiveRecord::RecordInvalid => err
    render json: { error: "Checkout fallito: #{err.message}" }, status: :unprocessable_entity
  end

  # PUT /api/v1/orders/:id
  def update
    if @order.update(order_params)
      render json: OrderSerializer.new(@order).serializable_hash[:data][:attributes], status: :ok
    else
      render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/orders/:id
  def destroy
    # Per il delete, si considera solamente la cancellazione soft dell'ordine, impostando lo status a "cancelled".
    # In questo modo, si mantiene comunque traccia dell'ordine e dei suoi item, evitando di cancellare dati importanti.
    if @order.update(status: :cancelled)
      render json: { message: "Ordine cancellato con successo." }, status: :ok
    else
      render json: { error: "Impossibile cancella l'ordine." }, status: :unprocessable_entity
    end
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def order_params
    params.expect(order: [ :street, :city, :zip_code, :country, :stripe_payment_token ])
  end
end
