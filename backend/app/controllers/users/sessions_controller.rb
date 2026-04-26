class Users::SessionsController < Devise::SessionsController
  include RackSessionsFix
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
    render json: {
      status: {
        code: 200,
        message: "Ti sei loggato con successo.",
        data: {
          user: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
        }
      }
    }, status: :ok
  end

  # Uso di *_args per evitare eventuali errori in chiamata da parte della libreria devise
  def respond_to_on_destroy(*_args)
=begin     if request.headers["Authorization"].present?
      jwt_payload = JWT.decode(request.headers["Authorization"].split(" ").last,
                                Rails.application.credentials.devise_jwt_secret_key!).first
      current_user = User.find(jwt_payload["sub"])
=end
      # Non serve fare la decodifica del token JWT, devise ha già popolato l'helper current_user
      if current_user
        render json: {
          status: 200,
          message: "You logged out successfully."
        }, status: :ok
      else
        render json: {
          status: 401,
          message: "Impossibile trovare una sessione attiva."
        }, status: :unauthorized
      end
    end
=begin
  end
=end
end
