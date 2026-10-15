class Api::V1::Admin::UsersController < Api::V1::AdminController
  SORTABLE_COLUMNS = %w[id first_name last_name email admin created_at].freeze

  before_action :set_user, only: [ :show, :update, :destroy ]

  # GET /admin/users
  def index
    users = apply_sorting(User.all, allowed: SORTABLE_COLUMNS, default: { last_name: :asc, first_name: :asc })
    users = search_by_txt(users) if params[:q].present?

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
        message: I18n.t("api.messages.user_updated_successfully", name: "#{@user.first_name} #{@user.last_name}"),
        data: serialize_resource(@user, UserSerializer),
      )
    else
      render_error(
        message: I18n.t("api.messages.user_update_error", name: "#{@user.first_name} #{@user.last_name}"),
        errors: @user.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  # DELETE /admin/users/:id
  def destroy
    # L'admin non può eliminare sé stesso da qui (resterebbe senza accesso all'area admin):
    # per il proprio account si usa DELETE /auth/me.
    if @user == current_user
      render_error(message: :cannot_delete_self, status: :forbidden)
      return
    end

    if @user.destroy
      render_success(
        message: I18n.t("api.messages.user_deleted_successfully", name: "#{@user.first_name} #{@user.last_name}"),
      )
    else
      render_error(
        message: I18n.t("api.messages.user_delete_error", name: "#{@user.first_name} #{@user.last_name}"),
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

  def search_by_txt(scope)
    scope.where("first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q OR number ILIKE :q", q: "%#{params[:q]}%")
  end
end
