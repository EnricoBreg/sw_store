module Authorization
  extend ActiveSupport::Concern

  included do
    def render_unauthorized
      render json: {
        error: "Forbidden",
        message: "Accesso negato: non hai i permessi richiesti da amministratore."
      }, status: :forbidden
    end

    def render_unauthenticated
      render json: {
        error: "Unauthorized",
        message: "Autenticazione richiesta: accedi per continuare."
      }, status: :unauthorized
    end
  end


  class_methods do
    def authenticated_access_only(**options)
      before_action :ensure_authenticated!, **options
    end

    def admin_access_only(**options)
      # 1. Verificare se l'utente è autenticato (con Devise)
      # 2. Verificare se l'utente loggato ha il ruolo di admin
      before_action :ensure_authenticated!, **options
      before_action :ensure_admin!, **options
    end
  end

  private
  def ensure_authenticated!
    render_unauthenticated unless user_signed_in?
  end

  def ensure_admin!
    render_unauthorized unless current_user&.admin?
  end
end
