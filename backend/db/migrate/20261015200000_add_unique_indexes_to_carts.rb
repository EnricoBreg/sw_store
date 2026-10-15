class AddUniqueIndexesToCarts < ActiveRecord::Migration[8.1]
  def change
    # Un prodotto compare una sola volta per carrello (la quantità si somma sulla stessa riga).
    add_index :cart_items, [ :cart_id, :product_id ], unique: true

    # Un solo carrello per utente.
    remove_index :carts, :user_id
    add_index :carts, :user_id, unique: true
  end
end
