class AddAddressNameToAddresses < ActiveRecord::Migration[8.1]
  def change
    add_column :addresses, :first_name, :string, null: false
    add_column :addresses, :last_name, :string, null: false
  end
end
