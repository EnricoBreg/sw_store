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

  # Se errors non è indicato contiene il solo messaggio, così ogni risposta di errore ha almeno un elemento in errors.
  def render_error(message: :bad_request, errors: nil, status: :bad_request)
    translated_message = if message.is_a?(Symbol)
      I18n.t("api.errors.#{message}", default: I18n.t("api.messages.#{message}", default: message.to_s.humanize))
    else
      message
    end

    response = {
      success: false,
      message: translated_message,
      errors: errors.presence || [ translated_message ]
    }

    render json: response, status: status
  end
end
