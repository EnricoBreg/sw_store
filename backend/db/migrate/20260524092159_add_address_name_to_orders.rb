class AddAddressNameToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :first_name, :string, null: false
    add_column :orders, :last_name, :string, null: false
  end
end
