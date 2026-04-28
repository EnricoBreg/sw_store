module Authorization
  extend ActiveSupport::Concern
  
  included do
    def render_unauthorized
      render json: {
        error: "Forbidden",
        message: "Accesso negato: non hai i permessi richiesti da amministratore."
      }, status: :forbidden
    end  
  end


  class_methods do
    def admin_access_only(**options)
      # 1. Verificare se l'utente è autenticato (con Devise)
      # 2. Verificare se l'utente loggato ha il ruolo di admin
      before_action :authenticate_user!, **options
      before_action :ensure_admin!, **options
    end
  end 

  private 
  def ensure_admin!
    render_unauthorized unless current_user&.admin?
  end 
end