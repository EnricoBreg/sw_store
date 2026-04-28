Rails.application.routes.draw do
  # ========================================================
  #   Routes per authenticazione e registrazione
  # ========================================================
  devise_for :users,
    path: "api/v1/auth",
    path_names: {
      sign_in: "login",
      sign_out: "logout",
      registration: "signup"
    },
    controllers: {
      sessions: "auth/sessions",
      registrations: "auth/registrations"
    }

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      # ========================================================
      #   Routes per gestione utente corrente
      # ========================================================
      # resource "/auth/me", controller: :current_user, only: [ :show, :update, :destroy ]
      get "/auth/me", to: "current_user#show"
      put "/auth/me", to: "current_user#update"
      delete "/auth/me", to: "current_user#destroy"

      # ========================================================
      #   Routes Admin per gestione prodotti, ...
      # ========================================================
      namespace :admin do
        resources :products
        resources :categories
        resources :users, except: [ :create ] # La creazione degli utenti avviene tramite registrazione, non da admin
      end

      # ========================================================
      #   Routes pubbliche per utenti non loggati
      # ========================================================
      resources :products, only: [ :index, :show ]
      resources :categories, only: [ :index, :show ]
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
