class Api::V1::CurrentUserController < Api::V1::AuthenticatedController
  # GET /auth/me
  def show
    render_success(
      data: serialize_resource(current_user, UserSerializer)
    )
  end

  # PUT /auth/me
  def update
    # La modifica di password o email richiede la password attuale (current_password):
    # Devise mette a disposizione l'helper update_with_password, che la verifica.
    # Gli altri dati si aggiornano con un normale update.
    attributes = user_params

    update_successful = if requires_current_password?(attributes)
      current_user.update_with_password(attributes)
    else
      current_user.update(attributes.except(:current_password, :password, :password_confirmation))
    end

    if update_successful
      render_success(
        message: :info_updated_successfully,
        data: serialize_resource(current_user, UserSerializer)
      )
    else
      render_error(
        message: :info_update_error,
        errors: current_user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /auth/me
  def destroy
    if current_user.destroy
      render_success(
        message: :account_deleted_successfully,
      )
    else
      render_error(
        message: :account_delete_error,
        errors: current_user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private
  def user_params
    params.expect(user: [ :first_name, :last_name, :email, :number, :date_of_birth, :password, :password_confirmation, :current_password ])
  end

  def requires_current_password?(attributes)
    attributes[:password].present? || (attributes.key?(:email) && attributes[:email] != current_user.email)
  end
end
