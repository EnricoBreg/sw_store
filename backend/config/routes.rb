Rails.application.routes.draw do
  # ========================================================
  #   Routes per authenticazione e registrazione
  # ========================================================
  devise_for :users, path: "auth", defaults: { format: :json }, path_names: {
    sign_in: "login",
    sign_out: "logout",
    registration: "signup"
  }, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  # ========================================================
  #   Routes per gestione utente corrente
  # ========================================================
  get "auth/me", to: "current_user#index", defaults: { format: :json }


  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
