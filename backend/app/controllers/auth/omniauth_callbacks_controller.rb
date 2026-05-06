class Auth::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    @user = User.from_ominauth(request.env["omniauth.auth"])

    if @user.persisted?
      token = @user.generate_twt

      redirect_to "http://localhost:4200/#/oauth/callback?token=#{token}", allow_other_host: true
    else
      Rails.logger.error "User persist failed: #{@user.errors.full_messages}"
      redirect_to "http://localhost:4200/login?error=oauth_failed", allow_other_host: true
    end
  end

  def failure
    redirect_to "http://localhost:4200/login?error=oauth_canceled", allow_other_host: true
  end
end
