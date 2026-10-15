# Risposta di Devise/Warden quando l'autenticazione fallisce (es. credenziali errate al login).
# L'app è solo API, quindi la risposta è sempre JSON nel formato standard degli errori.
# Gira fuori dai controller: la lingua va impostata qui a partire da Accept-Language.
class CustomFailureApp < Devise::FailureApp
  def respond
    I18n.with_locale(RequestLocale.from(request)) { json_error_response }
  end

  private

  def json_error_response
    self.status = :unauthorized
    self.content_type = "application/json"

    # Messaggio localizzato di Devise per il motivo del fallimento (es. credenziali non valide)
    message = i18n_message
    self.response_body = { success: false, message: message, errors: [ message ] }.to_json
  end
end
