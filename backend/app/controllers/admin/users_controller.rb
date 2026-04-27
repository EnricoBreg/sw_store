class Admin::UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [ :show, :update, :destroy ]

  # GET /admin/users
  def index
    @users = User.all
    render json: @users, status: :ok
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
end
