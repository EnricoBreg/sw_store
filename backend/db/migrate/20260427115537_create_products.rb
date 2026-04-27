class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description
      t.decimal :price
      t.decimal :discount_percentage
      t.integer :stock_quantity
      t.boolean :active
      t.string :image_url # TODO: implementare la gestione delle immagini (BLOB?)

      t.timestamps
    end
  end
end
