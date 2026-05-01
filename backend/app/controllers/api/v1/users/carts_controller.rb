class Api::V1::Users::CartsController < Api::V1::AuthenticatedController
  before_action :set_product, only: [ :add_product, :remove_product ]

  # GET /api/v1/cart
  def show
    # render json: current_user.cart, status: :ok
    render json: CartSerializer.new(current_user.cart).serializable_hash[:data][:attributes], status: :ok
  end

  def add_product
    current_user.cart.add(@product)
    if current_user.cart.save
      render json: current_user.cart, status: :ok
    else
      render json: { error: "Errore durante l'aggiunta del prodotto al carrello." }, status: :unprocessable_entity
    end
  end

  def remove_product
    current_user.cart.remove(@product)
    if current_user.cart.save
      render json: current_user.cart, status: :ok
    else
      render json: { error: "Errore durante la rimozione del prodotto dal carrello." }, status: :unprocessable_entity
    end
  end

  private

  def set_product
    @product = Product.find(params[:product_id])
  end
end
