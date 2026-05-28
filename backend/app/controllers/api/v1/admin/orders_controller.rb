class Api::V1::Admin::OrdersController < Api::V1::AdminController
  before_action :set_order, only: [ :show, :update, :destroy ]

  # GET /admin/orders
  def index
    if params[:order_by].present?
      order_by = params[:order_by]
      order_direction = params[:order_direction] || "asc"
      orders = Order.all.order("#{order_by} #{order_direction}")
    else
      orders = Order.all.order(created_at: :desc)
    end

    orders = search_by_customer_name_or_id(orders) if params[:q].present?

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
        message: I18n.t("api.messages.order_updated_successfully", id: @order.id),
        data: serialize_resource(@order, OrderSerializer),
      )
    else
      render_error(
        message: I18n.t("api.messages.order_update_error", id: @order.id),
        errors: @order.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/orders/:id
  def destroy
    if @order.update(status: "cancelled")
      render_success(
        message: I18n.t("api.messages.order_deleted_successfully", id: @order.id),
        data: serialize_resource(@order, OrderSerializer),
      )
    else
      render_error(
        message: I18n.t("api.messages.order_update_error", id: @order.id),
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
    params.expect(order: [ :first_name, :last_name, :street, :city, :zip_code, :country, :stripe_payment_token, :status, :created_at ])
  end

  def search_by_customer_name_or_id(scope)
    query = params[:q].strip
    scope.joins(:user)
      .where("orders.id::text ILIKE :query OR users.first_name ILIKE :query OR users.last_name ILIKE :query", query: "%#{query}%")
  end
end
