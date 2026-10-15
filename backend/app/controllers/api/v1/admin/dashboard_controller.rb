class Api::V1::Admin::DashboardController < Api::V1::AdminController
  DEFAULT_LOW_STOCK_THRESHOLD = 5
  LOW_STOCK_LIMIT = 10
  LATEST_ORDERS_LIMIT = 5

  # GET /admin/dashboard
  def show
    threshold = low_stock_threshold
    orders_by_status = Order.statuses.keys.index_with(0).merge(Order.group(:status).count)

    render_success(
      data: {
        orders_count: orders_by_status.values.sum,
        orders_by_status: orders_by_status,
        # Il fatturato esclude gli ordini annullati e rimborsati.
        revenue: Order.where.not(status: %w[cancelled refunded]).sum(:total_amount).to_d,
        products_count: Product.count,
        active_products_count: Product.active.count,
        users_count: User.count,
        low_stock_threshold: threshold,
        low_stock_products: serialize_collection(
          Product.active.where(stock_quantity: ..threshold).order(:stock_quantity, :name).limit(LOW_STOCK_LIMIT),
          ProductSerializer
        ),
        latest_orders: serialize_collection(
          Order.includes(:user, order_items: :product).order(created_at: :desc).limit(LATEST_ORDERS_LIMIT),
          OrderSerializer
        )
      }
    )
  end

  private

  def low_stock_threshold
    return DEFAULT_LOW_STOCK_THRESHOLD if params[:low_stock_threshold].blank?

    threshold = Integer(params[:low_stock_threshold].to_s, exception: false)
    if threshold.nil? || threshold.negative?
      raise InvalidParameterError, I18n.t("api.errors.invalid_parameter", param: "low_stock_threshold", allowed: "0, 1, 2, ...")
    end

    threshold
  end
end
