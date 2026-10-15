# Ordinamento delle liste tramite i parametri order_by e order_direction.
# Sono ammesse solo le colonne indicate dal controller: un valore diverso solleva InvalidParameterError,
# che BaseController trasforma in una risposta 400.
module Sortable
  extend ActiveSupport::Concern

  DIRECTIONS = %w[asc desc].freeze

  private

  def apply_sorting(scope, allowed:, default:)
    return scope.order(default) if params[:order_by].blank?

    column = params[:order_by].to_s
    direction = (params[:order_direction].presence || "asc").to_s.downcase

    unless allowed.include?(column)
      raise InvalidParameterError, I18n.t("api.errors.invalid_parameter", param: "order_by", allowed: allowed.join(", "))
    end
    unless DIRECTIONS.include?(direction)
      raise InvalidParameterError, I18n.t("api.errors.invalid_parameter", param: "order_direction", allowed: DIRECTIONS.join(", "))
    end

    # La forma a hash qualifica la colonna con il nome della tabella (sicura anche con le join).
    scope.order(column => direction)
  end
end
