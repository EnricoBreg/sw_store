class Api::V1::Admin::OrdersController < Api::V1::AdminController
  before_action :set_order, only: [ :show, :update, :destroy ]

  # GET /admin/orders
  def index
    orders = Order.all.order(created_at: :desc)
    orders = orders.where(status: params[:status]) if params[:status].present?

    if params[:created_after].present? && params[:created_before].present?
      created_after = Time.parse(params[:created_after]).beginning_of_day
      created_before = Time.parse(params[:created_before]).end_of_day
      orders = oorders.where(created_at: created_after..created_before)
    elsif params[:created_after].present?
      created_after = Time.parse(params[:created_after]).beginning_of_day
      orders = orders.where("created_at >= ?", created_after)
    elsif params[:created_before].present?
      created_before = Time.parse(params[:created_before]).end_of_day
      orders = orders.where("created_at <= ?", created_before)
    end

    @pagy, @orders = pagy(orders, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@orders, OrderSerializer),
      meta: @pagy.data_hash,
    )
  end

  # GET /admin/orders/:id
  def show
    render_success(
      data: serialize_resource(@order, OrderSerializer),
    )
  end

  # PUT /admin/orders/:id
  def update
    if @order.update(order_params)
      render_success(
        message: "Ordine #{@order.id} aggiornato con successo.",
        data: serialize_resource(@order, OrderSerializer),
      )
    else
      render_error(
        message: "Errore nell'aggiornamento dell'ordine (#{@order.id}).",
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/orders/:id
  def destroy
    if @order.update(status: "cancelled")
      render_success(
        message: "Ordine #{@order.id} annullato con successo",
        data: serialize_resource(@order, OrderSerializer),
      )
    else
      render_error(
        message: "Errore nell'annullamento dell'ordine (#{@order.id}).",
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def order_params
    params.expect(order: [ :street, :city, :zip_code, :country, :stripe_payment_token, :status, :created_at ])
  end
end
