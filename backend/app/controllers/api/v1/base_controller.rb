class Api::V1::BaseController < ApplicationController
  include ApiResponses

  # Interceptor per le eventuali eccezioni sollevate dai controller per restituire una risposta API coerente
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_parameters_missing
  rescue_from ActionController::ParameterMissing, with: :render_parameters_missing

  def render_not_found(exception)
    render_error(
      message: :not_found,
      errors: [ exception.message ],
      status: :not_found
    )
  end

  def render_parameters_missing(exception)
    render_error(
      message: :parameters_missing,
      errors: [ exception.message ],
      status: :unprocessable_entity
    )
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
