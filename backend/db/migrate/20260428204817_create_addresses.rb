class CreateAddresses < ActiveRecord::Migration[8.1]
  def change
    create_table :addresses do |t|
      t.references :user, null: false, foreign_key: true
      t.string :street
      t.string :city
      t.string :zip_code
      t.string :country
      t.string :nickname
      t.boolean :is_default

      t.timestamps
    end
    add_index :addresses, [ :user_id, :nickname ], unique: true
  end
end
