module Authorization
  extend ActiveSupport::Concern

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
    render_error(message: :unauthorized, status: :unauthorized) unless user_signed_in?
  end

  def ensure_admin!
    render_error(message: :forbidden, status: :forbidden) unless current_user&.admin?
  end
end
