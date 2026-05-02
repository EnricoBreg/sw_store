class Api::V1::CurrentUserController < Api::V1::AuthenticatedController
  # GET /auth/me
  def show
    render_success(
      data: serialize_resource(current_user, UserSerializer)
    )
  end

  # PUT /auth/me
  def update
    # Se l'utente durante la modifica dei suoi dati, fornisce la password,
    # allora si aggiorna anche quella, altrimenti si procede con un normale update.
    # Devise mette a disposizione un helper update_with_password, per gestire
    # facilmente il cambio password.

    update_successfull = if user_params[:password].present?
      current_user.update_with_password(user_params)
    else
      current_user.update(user_params.exept(:current_password))
    end

    if update_successfull
      render_success(
        message: "Dati utente aggiornati con successo",
        data: serialize_resource(current_user, UserSerializer)
      )
    else
      render_error(
        message: "Errore nell'aggiornamento dei dati utente.",
        errors: current_user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /auth/me
  def destroy
    if current_user.destroy
      render_success(
        message: "Account eliminato con successo.",
      )
    else
      render_error(
        message: "Errore nell'eliminazione dell'account.",
        errors: current_user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private
  def user_params
    params.expect(user: [ :name, :email, :password, :password_confirmation, :current_password  ])
  end
end
