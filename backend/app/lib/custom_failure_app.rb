class CustomFailureApp < Devise::FailureApp
  def respond
    # Intercetta le richieste esplictamente JSON e anche quelle con l'header "Accept" appropriato
    if request.format.to_s.include?("json") || request.headers["Accept"].to_s.include?("json")
      json_api_error_response
    else
      super
    end
  end

  private

  def json_api_error_response
    self.status = :unauthorized
    self.content_type = "application/json"

    # Recupera il messaggio localizzato per l'errore di autenticazione da Devise
    message = i18n_message

    # Costruisce una risposta coerente con lo standard JSON API per gli errori, con il messaggio localizzato
    # TODO: valudare come usare un serializer (se possibile) per standardizzare le risposte
    self.response_body = {
      message: message,
      errors: [ message ],
      success: false
    }.to_json
  end
end
