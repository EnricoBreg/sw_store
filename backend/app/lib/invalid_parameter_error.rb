# Parametro di query con un valore non ammesso (es. order_by, status).
# BaseController la trasforma in una risposta 400; il messaggio (già tradotto) finisce in errors.
class InvalidParameterError < StandardError; end
