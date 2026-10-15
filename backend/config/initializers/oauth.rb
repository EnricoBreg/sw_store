# La request phase di OmniAuth (POST /api/v1/auth/google_oauth2) non verifica un token CSRF:
# la SPA avvia il login con un form POST e, in modalità API, non ha un token di sessione Rails da inviare.
# Rischio residuo basso:
# - la callback è protetta dal parametro "state" di OAuth2, che omniauth-oauth2 verifica contro la sessione;
# - un CSRF sulla request phase può solo avviare il login Google della vittima sul suo stesso account:
#   non esiste il collegamento di un account Google a un utente già autenticato (scenario di CVE-2015-9284).
OmniAuth.config.request_validation_phase = nil
