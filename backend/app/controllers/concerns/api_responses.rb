# Classe di supporto per standardizzare le risposte API dei vari controller.
# I due metodi principali sono "render_success" e "render_error", che accettano parametri per personalizzare la risposta.
# Entrambi i metodi usano il metodo compact per rimuovere eventuali chiavi con valori nil, garantendo delle risposte pulite e coerenti.
module ApiResponses
  extend ActiveSupport::Concern

  def render_success(data: {}, message: nil, meta: {}, status: :ok)
    translated_message = if message.is_a?(Symbol)
      I18n.t("api.errors.#{message}", default: I18n.t("api.messages.#{message}", default: message.to_s.humanize))
    else
      message
    end

    response = {
      success: true,
      message: translated_message,
      data: data,
      meta: meta.presence # presence restituisce nil se l'oggetto è vuoto
    }.compact

    render json: response, status: status
  end

  def render_error(message: "Si è verificato un errore generico.", errors: [], status: :bad_request)
    translated_message = if message.is_a?(Symbol)
      I18n.t("api.errors.#{message}", default: I18n.t("api.messages.#{message}", default: message.to_s.humanize))
    else
      message
    end

    response = {
      success: false,
      message: translated_message,
      errors: errors
    }.compact

    render json: response, status: status
  end
end
