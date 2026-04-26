class CurrentUserController < ApplicationController
  before_action :authenticate_user!

  # GET /auth/me
  def show
    render json: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
  end

  # PUT /auth/me
  def update
    # Se l'utente durante la modifica dei suoi dati, fornisce la password,
    # allora si aggiorna anche quella, altrimenti si procede con un normale update.
    # Devise mette a disposizione un helper update_with_password, per gestire
    # facilmente il cambio password

    update_successfull = if user_params[:password].present?
      current_user.update_with_password(user_params)
    else
      current_user.update(user_params.exept(:current_password))
    end

    if update_successfull
      render json: UserSerializer.new(current_user).serializable_hash[:data][:attributes], status: :ok
    else
      render json: {
        status: {
          code: 400,
          errors: current_user.errors.full_messages
        }
      }, status: :unprocessable_entity
    end
  end

  # DELETE /auth/me
  def destroy
    if current_user.destroy
      render json: { message: "Account eliminato con successo." }, status: :ok
    else
      render json: { message: "Impossibile eliminare l'account" }, status: :unprocessable_entity
    end
  end

  private
  def user_params
    params.expect(user: [ :name, :email, :password, :password_confirmation, :current_password  ])
  end
end
