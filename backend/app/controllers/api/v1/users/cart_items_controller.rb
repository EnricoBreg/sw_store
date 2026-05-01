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
      render json: @cart_item, status: :created
    else
      render json: { error: "Errore durante l'aggiunta del prodotto al carrello: #{@cart_item.errors.full_messages.to_sentence}" }, status: :unprocessable_entity
    end
  end

  def update
    quantity = cart_item_params[:quantity].to_i

    @cart_item = @cart.cart_items.find_by(product_id: @product.id)
    if @cart_item.nil?
      render json: { error: "Il prodotto non è presente nel carrello." }, status: :not_found
      return
    end

    if quantity <= 0
      @cart_item.destroy
      render json: { message: "Il prodotto è stato rimosso dal carrello." }, status: :ok
      return
    end

    if @cart_item.update(quantity: quantity)
      render json: @cart_item, status: :ok
    else
      render json: { error: "Errore durante l'aggiornamento del prodotto nel carrello: #{@cart_item.errors.full_messages.to_sentence}" }, status: :unprocessable_entity
    end
  end

  def destroy
    @cart_item = @cart.cart_items.find_by(product_id: @product.id)
    if @cart_item.nil?
      render json: { error: "Il prodotto non è presente nel carrello." }, status: :not_found

    end

    if @cart_item.destroy
      render json: { message: "Il prodotto è stato rimosso dal carrello." }, status: :ok
    else
      render json: { error: "Errore durante la rimozione del prodotto dal carrello." }, status: :unprocessable_entity
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
