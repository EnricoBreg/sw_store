class Api::V1::Admin::UsersController < Api::V1::AdminController
  before_action :set_user, only: [ :show, :update, :destroy ]

  # GET /admin/users
  def index
    # TODO: implementare filtri
    users = User.all.order(last_name: :asc, first_name: :asc)
    users = serach_by_name(users) if params[:q].present?

    @pagy, @users = pagy(users, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@users, UserSerializer),
      meta: @pagy.data_hash
    )
  end

  # GET /admin/users/:id
  def show
    render_success(
      data: serialize_resource(@user, UserSerializer),
    )
  end

  # PUT /admin/users/:id
  def update
    if @user.update(user_params)
      render_success(
        message: "Utente #{@user.id} aggiornato con successo",
        data: serialize_resource(@user, UserSerializer),
      )
    else
      render_error(
        message: "Errore nell'aggiornamento dell'utente #{@user.id}.",
        errors: @user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/users/:id
  def destroy
    if @user.destroy
      render_success(
        message: "Utente #{@user.id} eliminato con successo.",
      )
    else
      render_error(
        message: "Errore nell'eliminazione dell'utente #{@user.id}.",
        errors: @user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.expect(user: [ :first_name, :last_name, :email, :number, :password, :password_confirmation, :date_of_birth ])
  end

  def serach_by_name(scope)
    scope.where("first_name ILIKE :q OR last_name ILIKE :q", q: "%#{params[:q]}%")
  end
end
