class ApplicationController < ActionController::API
  include Authorization
  include Pagy::Method

  before_action :debug_params
  before_action :configure_permitted_parameters, if: :devise_controller?

  around_action :switch_locale

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name date_of_birth])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[first_name last_name])
  end

  def switch_locale(&action)
    locale = extract_locale_from_header || I18n.default_locale
    I18n.with_locale(locale, &action)
  end

  def extract_locale_from_header
    language = request.headers["Accept-Language"]&.scan(/^[a-z]{2}/)&.first
    if language.present? && I18n.available_locales.include?(language.to_sym)
      language.to_sym
    else
      nil
    end
  end

  private

  def debug_params
    Rails.logger.debug "Params: #{params.inspect}"
  end
end
