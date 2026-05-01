class Api::V1::Admin::OrdersController < Api::V1::AdminController
  before_action :set_order, only: [ :show, :update, :destroy ]

  # GET /admin/orders
  def index
    orders = Order.all.order(created_at: :desc)
    orders = orders.where(status: params[:status]) if params[:status].present?

    Rails.logger.debug "\n\n#{params[:status]} - #{params[:created_after]} - #{params[:created_before]}"

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

    render json: {
      data: @orders.map { |order| OrderSerializer.new(order).serializable_hash[:data][:attributes] },
      meta: @pagy.data_hash
    }, status: :ok
  end

  # GET /admin/orders/:id
  def show
    render json: OrderSerializer.new(@order).serializable_hash[:data][:attributes], status: :ok
  end

  # PUT /admin/orders/:id
  def update
    if @order.update(order_params)
      render json: OrderSerializer.new(@order).serializable_hash[:data][:attributes], status: :ok
    else
      render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/orders/:id
  def destroy
    if @order.update(status: "cancelled")
      render json: { message: "Ordine annullato con successo" }, status: :ok
    else
      render json: { error: "Impossibile annullare l'ordine" }, status: :unprocessable_entity
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
