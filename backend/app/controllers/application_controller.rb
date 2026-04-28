class ApplicationController < ActionController::API
  include Authorization
  include Pagy::Method

  before_action :debug_params
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[name])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[name])
  end

  private

  def debug_params
    Rails.logger.debug "Params: #{params.inspect}"
  end
end
