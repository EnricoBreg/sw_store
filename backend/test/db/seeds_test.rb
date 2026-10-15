require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  MODELS = [ Category, Product, User, Order, ActiveStorage::Attachment ].freeze

  def load_seed
    # Il seed stampa i conteggi: nei test l'output viene scartato.
    capture_io { Rails.application.load_seed }
  end

  def counts
    MODELS.to_h { |model| [ model.name, model.count ] }
  end

  test "the seed creates active products with an image and the demo users" do
    load_seed

    seeded = Product.where(name: "Macchina da caffè espresso").sole
    assert seeded.active?
    assert seeded.image.attached?
    assert_equal "Casa", seeded.category.name
    assert Product.joins(:category).where(categories: { name: "Videogiochi" }).active.exists?

    assert User.find_by!(email: "admin@swstore.com").admin?
    %w[cliente@swstore.com e2e.user@swstore.test e2e.logout@swstore.test].each do |email|
      user = User.find_by!(email: email)
      assert_not user.admin?
    end
    assert User.find_by!(email: "e2e.user@swstore.test").valid_password?("E2eTest-2026!")
  end

  test "running the seed twice changes nothing" do
    load_seed
    after_first_run = counts

    load_seed

    assert_equal after_first_run, counts
  end

  test "the seed does not modify or delete existing data" do
    product = products(:headphones)
    product.update_columns(price: 1.23)
    category_count = Category.count

    load_seed

    assert_equal BigDecimal("1.23"), product.reload.price
    assert Order.exists?(orders(:customer_pending).id)
    assert Category.exists?(categories(:electronics).id)
    assert_operator Category.count, :>=, category_count
  end
end
