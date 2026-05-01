class RenameCardNumerOnOrders < ActiveRecord::Migration[8.1]
  def change
    rename_column :orders, :card_number, :stripe_payment_token
  end
end
