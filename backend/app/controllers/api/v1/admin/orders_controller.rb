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

    if params[:from_date].present? && params[:to_date].present?
      from_date = Time.parse(params[:from_date]).beginning_of_day
      to_date = Time.parse(params[:to_date]).end_of_day
      orders = orders.where(created_at: from_date..to_date)
    elsif params[:from_date].present?
      from_date = Time.parse(params[:from_date]).beginning_of_day
      orders = orders.where("created_at >= ?", from_date)
    elsif params[:to_date].present?
      to_date = Time.parse(params[:to_date]).end_of_day
      orders = orders.where("created_at <= ?", to_date)
    end

    if params[:min_total_amount].present? && params[:max_total_amount].present?
      min_total_amount = params[:min_total_amount].to_f
      max_total_amount = params[:max_total_amount].to_f
      orders = orders.where(total_amount: min_total_amount..max_total_amount)
    elsif params[:min_total_amount].present?
      min_total_amount = params[:min_total_amount].to_f
      orders = orders.where("total_amount >= ?", min_total_amount)
    elsif params[:max_total_amount].present?
      max_total_amount = params[:max_total_amount].to_f
      orders = orders.where("total_amount <= ?", max_total_amount)
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
      .where("orders.id::text ILIKE :query OR users.first_name ILIKE :query OR users.last_name ILIKE :query OR users.email ILIKE :query", query: "%#{query}%")
  end
end
