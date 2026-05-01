class Api::V1::Admin::UsersController < Api::V1::AdminController
  before_action :set_user, only: [ :show, :update, :destroy ]

  # GET /admin/users
  def index
    # TODO: implementare filtri
    users = User.all.order(last_name: :asc, first_name: :asc)
    users = serach_by_name(users) if params[:q].present?

    @pagy, @users = pagy(users, page: params[:page], items: params[:limit])

    render json: {
      data: @users,
      meta: @pagy.data_hash
    }, status: :ok
  end

  # GET /admin/users/:id
  def show
    render json: @user, status: :ok
  end

  # PUT /admin/users/:id
  def update
    if @user.update(user_params)
      render json: @user, status: :ok
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/users/:id
  def destroy
    if @user.destroy
      render json: { message: "Utente eliminato con successo" }, status: :ok
    else
      render json: { error: "Impossibile eliminare l'utente" }, status: :unprocessable_entity
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
