class AddCodeToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :code, :string, null: false
    add_column :orders, :sequence_number, :integer, null: false

    add_index :orders, :code, unique: true
  end
end
