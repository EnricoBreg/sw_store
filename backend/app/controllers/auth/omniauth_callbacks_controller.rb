class Auth::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    @user = User.from_omniauth(request.env["omniauth.auth"])

    if @user.persisted?
      # Token emesso come quello di POST /auth/login (stesso segreto, scadenza e jti dell'utente),
      # così le altre sessioni dell'utente restano valide.
      token, _payload = Warden::JWTAuth::UserEncoder.new.call(@user, :user, nil)

      # Il token viaggia nel fragment (#token=...): il browser non lo invia ai server,
      # quindi non finisce nei log di accesso né nell'header Referer.
      redirect_to "#{Rails.configuration.x.frontend_url}/oauth/callback##{{ token: token }.to_query}", allow_other_host: true
    else
      Rails.logger.error "User persist failed: #{@user.errors.full_messages}"
      redirect_to frontend_url("/login", error: "oauth_failed"), allow_other_host: true
    end
  end

  def failure
    redirect_to frontend_url("/login", error: "oauth_canceled"), allow_other_host: true
  end

  private

  def frontend_url(path, params)
    "#{Rails.configuration.x.frontend_url}#{path}?#{params.to_query}"
  end
end
