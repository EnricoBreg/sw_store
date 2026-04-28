class Api::V1::Users::AddressesController < Api::V1::AuthenticatedController
  before_action :set_address, only: [ :show, :update, :destroy ]

  def index
    addresses = current_user.addresses.order(nickname: :asc)
    @pagy, @addresses = pagy(addresses, page: params[:page], items: params[:limit])
    render json: {
      data: @addresses,
      meta: @pagy.data_hash
    }
  end

  def show
    render json: @address
  end

  def create
    @address = current_user.addresses.new(address_params)
    if @address.save
      render json: @address, status: :created
    else
      render json: @address.errors, status: :unprocessable_content
    end
  end

  def update
    if @address.update(address_params)
      render json: @address
    else
      render json: @address.errors, status: :unprocessable_content
    end
  end

  def destroy
    if @address.destroy
      head :no_content
    else
      render json: @address.errors, status: :unprocessable_content
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
