class Api::V1::Users::AddressesController < Api::V1::AuthenticatedController
  before_action :set_address, only: [ :show, :update, :destroy ]

  def index
    addresses = current_user.addresses.order(nickname: :asc)
    @pagy, @addresses = pagy(addresses, page: params[:page], items: params[:limit])

    render_success(
      data: serialize_collection(@addresses, AddressSerializer),
      meta: @pagy.data_hash
    )
  end

  def show
    render_success(
      data: serialize_resource(@address, AddressSerializer)
    )
  end

  def create
    @address = current_user.addresses.new(address_params)
    if @address.save
      render_success(
        message: I18n.t("api.messages.address_created_successfully", nickname: @address.nickname),
        data: serialize_resource(@address, AddressSerializer),
        status: :created
      )
    else
      render_error(
        message: :address_create_error,
        errors: @address.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def update
    if @address.update(address_params)
      render_success(
        message: I18n.t("api.messages.address_updated_successfully", nickname: @address.nickname),
        data: serialize_resource(@address, AddressSerializer),
      )
    else
      render_error(
        message: I18n.t("api.messages.address_update_error", nickname: @address.nickname),
        errors: @address.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def destroy
    if @address.destroy
      render_success(
        message: I18n.t("api.messages.address_deleted_successfully", nickname: @address.nickname),
      )
    else
      render_error(
        message: I18n.t("api.messages.address_delete_error", nickname: @address.nickname),
        errors: @address.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_address
    @address = current_user.addresses.find(params[:id])
  end

  def address_params
    params.expect(address: [ :street, :city, :zip_code, :country, :nickname, :is_default ])
  end
end
