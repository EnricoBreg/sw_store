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
        message: "Indirizzo creato con successo",
        data: serialize_resource(@address, AddressSerializer),
        status: :created
      )
    else
      render_error(
        message: "Errore nella creazione del nuovo indirizzo.",
        errors: @address.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def update
    if @address.update(address_params)
      render_success(
        message: "Indirizzo aggiornato con successo",
        data: serialize_resource(@address, AddressSerializer),
      )
    else
      render_error(
        message: "Errore nell'aggiornamento dell'indirizzo.",
        errors: @address.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def destroy
    if @address.destroy
      head :no_content
    else
      render_error(
        message: "Errore nell'eliminazione dell'indirizzo.",
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
