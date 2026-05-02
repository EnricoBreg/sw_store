class Api::V1::Users::CartsController < Api::V1::AuthenticatedController
  before_action :set_product, only: [ :add_product, :remove_product ]

  # GET /api/v1/cart
  def show
    render_success(
      data: serialize_resource(current_user.cart, CartSerializer)
    )
  end

  def add_product
    current_user.cart.add(@product)
    if current_user.cart.save
      render_success(
        message: "Prodotto #{@product.name} aggiunto al carrello con successo",
        data: serialize_resource(current_user.cart, CartSerializer)
      )
    else
      render_error(
        message: "Errore durante l'aggiunta del prodotto #{@product.name} al carrello.",
        errors: current_user.cart.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def remove_product
    current_user.cart.remove(@product)
    if current_user.cart.save
      render_success(
        message: "Prodotto #{@product.name} rimosso dal carrello con successo",
        data: serialize_resource(current_user.cart, CartSerializer)
      )
    else
      render_error(
        message: "Errore durante la rimozione del prodotto #{@product.name} dal carrello.",
        errors: current_user.cart.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_product
    @product = Product.find(params[:product_id])
  end
end
