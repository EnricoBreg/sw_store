class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :total_amount
      t.string :status
      t.string :street
      t.string :city
      t.string :zip_code
      t.string :country
      t.string :card_number

      t.timestamps
    end
  end
end
