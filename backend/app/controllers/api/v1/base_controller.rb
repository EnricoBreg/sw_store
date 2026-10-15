class Api::V1::BaseController < ApplicationController
  # Gestione centralizzata delle eccezioni: ogni errore risponde nel formato standard di render_error.
  # Rails cerca il gestore partendo dall'ultimo rescue_from dichiarato, quindi StandardError va per primo.
  rescue_from StandardError, with: :render_internal_server_error
  rescue_from ArgumentError, ActiveRecord::UnknownAttributeReference, ActionDispatch::Http::Parameters::ParseError,
    with: :render_bad_request
  rescue_from ActionController::ParameterMissing, with: :render_parameters_missing
  rescue_from ActiveRecord::InvalidForeignKey, ActiveRecord::RecordNotUnique, with: :render_conflict
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid

  private

  def render_bad_request(_exception)
    render_error(message: :bad_request, status: :bad_request)
  end

  def render_parameters_missing(exception)
    render_error(
      message: :parameters_missing,
      errors: [ I18n.t("api.errors.parameter_missing_detail", param: exception.param) ],
      status: :bad_request
    )
  end

  def render_not_found(_exception)
    render_error(message: :not_found, status: :not_found)
  end

  def render_conflict(_exception)
    render_error(message: :conflict, status: :conflict)
  end

  def render_record_invalid(exception)
    render_error(
      message: :unprocessable_entity,
      errors: exception.record.errors.full_messages,
      status: :unprocessable_entity
    )
  end

  # Anche in development e test la risposta resta nel formato standard (è parte del contratto):
  # i dettagli tecnici non vengono esposti al client, ma lo stack trace completo finisce nel log.
  def render_internal_server_error(exception)
    Rails.logger.error([ "#{exception.class}: #{exception.message}", *exception.backtrace ].join("\n"))
    render_error(message: :internal_server_error, status: :internal_server_error)
  end

  def serialize_collection(collection, serializer_class)
    collection.map do |items|
      # TODO: valutare se conviene usare il metodo compact per rimuovere eventuali chiavi con valori nil
      serializer_class.new(items).serializable_hash[:data][:attributes]
    end
  end

  def serialize_resource(resource, serializer_class)
    # TODO: valutare se conviene usare il metodo compact per rimuovere eventuali chiavi con valori nil
    serializer_class.new(resource).serializable_hash[:data][:attributes]
  end
end
