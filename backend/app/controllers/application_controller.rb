class ApplicationController < ActionController::API
  include ApiResponses
  include Authorization
  include Pagy::Method

  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name date_of_birth])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[first_name last_name])
  end

  private

  # La lingua (header Accept-Language) è impostata attorno a process_action e non con un around_action:
  # i rescue_from vengono eseguiti fuori dai callback, quindi con un around_action le risposte
  # di errore (404, 422, ...) uscirebbero sempre nella lingua di default.
  def process_action(...)
    I18n.with_locale(RequestLocale.from(request)) { super }
  end
end
