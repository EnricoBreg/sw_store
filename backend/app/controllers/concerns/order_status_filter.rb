# Filtro degli ordini per stato: parametro status con uno o più stati separati da virgola (es. "paid,shipped").
module OrderStatusFilter
  extend ActiveSupport::Concern

  private

  def filter_by_status(scope)
    return scope if params[:status].blank?

    statuses = params[:status].to_s.split(",").map(&:strip).compact_blank
    unknown = statuses - Order.statuses.keys
    if unknown.any?
      raise InvalidParameterError, I18n.t("api.errors.invalid_parameter", param: "status", allowed: Order.statuses.keys.join(", "))
    end

    scope.where(status: statuses)
  end
end
