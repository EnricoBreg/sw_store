ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "devise/jwt/test_helpers"
require_relative "support/fixture_load_order"

module ActiveSupport
  class TestCase
    # Un solo worker: il database di test è su un host PostgreSQL condiviso e la suite è piccola,
    # quindi non conviene creare un database sw_store_test-N per ogni processo.
    # Per parallelizzare basta impostare la variabile d'ambiente PARALLEL_WORKERS.
    parallelize(workers: 1)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all
  end
end

module ActionDispatch
  class IntegrationTest
    # Header per le richieste autenticate: JWT valido per l'utente indicato (come quello emesso da POST /auth/login).
    def auth_headers(user, headers = {})
      Devise::JWT::TestHelpers.auth_headers(headers.merge("Accept" => "application/json"), user)
    end

    def json_response
      JSON.parse(response.body)
    end
  end
end
