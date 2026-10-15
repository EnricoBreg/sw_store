# Lingua della risposta ricavata dall'header Accept-Language (es. "en-US,en;q=0.9" -> :en).
# Se la lingua non è supportata si usa quella di default (:it).
module RequestLocale
  def self.from(request)
    language = request.headers["Accept-Language"].to_s[/\A[a-z]{2}/]&.to_sym
    I18n.available_locales.include?(language) ? language : I18n.default_locale
  end
end
