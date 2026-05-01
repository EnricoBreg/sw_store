class ChangeStatusDefaultOnOrders < ActiveRecord::Migration[8.1]
  def change
    change_column_default :orders, :status, "pending"
  end
end
