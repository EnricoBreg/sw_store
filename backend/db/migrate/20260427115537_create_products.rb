class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description
      t.decimal :price
      t.decimal :discount_percentage
      t.integer :stock_quantity
      t.boolean :active

      t.timestamps
    end
  end
end
