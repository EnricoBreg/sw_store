class OrderMailer < ApplicationMailer
  def confirmation
    @order = params[:order]
    @user = @order.user

    mail(
      to: @user.email,
      subject: I18n.t("mailer.orders.confirmation", codice: @order.code)
    )
  end
end
