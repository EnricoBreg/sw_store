class Api::V1::Users::CartItemsController < Api::V1::AuthenticatedController
  before_action :set_cart
  before_action :set_product, only: [ :update, :destroy ]

  def create
    # Estrazione del parametro product_id e quantity
    product_id = cart_item_params[:product_id]
    quantity = cart_item_params[:quantity].to_i

    product = Product.find(product_id)

    @cart_item = @cart.cart_items.find_by(product_id: product.id)
    if @cart_item
      # Se l'item esiste già, aggiorna la quantità
      @cart_item.quantity += quantity
    else
      # Altrimenti, crea un nuovo item da capo
      @cart_item = @cart.cart_items.build(product: product, quantity: quantity, unit_price: product.price)
    end

    if @cart_item.save
      render_success(
        message: "Prodotto #{@product.name} aggiunto al carrello con successo",
        data: @cart_item,
        status: :created
      )
    else
      render_error(
        message: "Errore durante l'aggiunta del prodotto #{@product.name} al carrello.",
        errors: @cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def update
    quantity = cart_item_params[:quantity].to_i

    @cart_item = @cart.cart_items.find_by(product_id: @product.id)
    if @cart_item.nil?
      render_error(
        message: "Il prodotto #{@cart_item.product.name} non è presente nel carrello.",
        status: :not_found
      )
      return
    end

    if quantity <= 0
      @cart_item.destroy
      render_success(
        message: "Il prodotto #{@cart_item.product.name} è stato rimosso dal carrello.",
      )
      return
    end

    if @cart_item.update(quantity: quantity)
      render_success(
        message: "La quantità del prodotto #{@cart_item.product.name} è stata aggiornata con successo.",
        data: serialize_resource(@cart_item, CartItemSerializer)
      )
    else
      render_error(
        message: "Errore durante l'aggiornamento del prodotto #{@cart_item.product.name} nel carrello.",
        errors: @cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  def destroy
    @cart_item = @cart.cart_items.find_by(product_id: @product.id)
    if @cart_item.nil?
      render_error(
        message: "Il prodotto #{@cart_item.product.name} non è presente nel carrello.",
        status: :not_found
      )
    end

    if @cart_item.destroy
      render_success(
        message: "Il prodotto #{@cart_item.product.name} è stato rimosso dal carrello.",
      )
    else
      render_error(
        message: "Errore durante la rimozione del prodotto #{@cart_item.product.name} dal carrello.",
        errors: @cart_item.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  end

  private

  def set_cart
    @cart = current_user.cart
  end

  def set_product
    @product = Product.find(params[:product_id])
  end

  def cart_item_params
    params.expect(cart_item: [ :product_id, :quantity ])
  end
end
