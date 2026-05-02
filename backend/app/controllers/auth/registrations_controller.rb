class Auth::RegistrationsController < Devise::RegistrationsController
  include RackSessionsFix
  include ApiResponses
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
    if resource.persisted?
      render_success(
        message: :signed_up,
        data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
      )
    else
      render_error(
        message: :signed_up_failed,
        errors: current_user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end
end
