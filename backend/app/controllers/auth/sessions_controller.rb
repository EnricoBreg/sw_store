class Auth::SessionsController < Devise::SessionsController
  include RackSessionsFix
  include ApiResponses
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
    render_success(
      message: :logged_in,
      data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
    )
  end

  # Uso di *_args per evitare eventuali errori in chiamata da parte della libreria devise
  def respond_to_on_destroy(*_args)
      # if request.headers["Authorization"].present?
      #   jwt_payload = JWT.decode(request.headers["Authorization"].split(" ").last,
      #                             Rails.application.credentials.devise_jwt_secret_key!).first
      #   current_user = User.find(jwt_payload["sub"])

      # Non serve fare la decodifica del token JWT, devise ha già popolato l'helper current_user
      if current_user
        render_success(
          message: :logged_out
        )
      else
        render_error(
          message: :not_logged_in,
          status: :unauthorized
        )
      end
    # end
  end
end
