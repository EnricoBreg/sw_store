class OrderMailerPreview < ActionMailer::Preview
  def confirmation
    order = Order.last
    OrderMailer.with(order: order).confirmation
  end
end
