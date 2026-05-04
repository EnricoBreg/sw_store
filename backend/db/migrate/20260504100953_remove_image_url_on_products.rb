class RemoveImageUrlOnProducts < ActiveRecord::Migration[8.1]
  def change
    remove_column :products, :image_url, :string
  end
end
