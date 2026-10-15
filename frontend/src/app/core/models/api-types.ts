export interface ApiResponse<T> {
  success: boolean; // Flag che indica il successo o meno della richiesta
  message?: string; // Eventuale messaggio inviato da Backend in risposta ad una richiesta (non sempre presente)
  data: T;          // Tipo di dato della rispota (es. Product[], Product, ...)
  meta?: PaginationMeta;  // Tipo di dato per i meta della paginazione (se presente)
  errors?: string[];  // Array di errori (stringhe) descrittive dell'eventuale errore verificatosi
}

// Metadati di paginazione inviati dal backend (Pagy). Le chiavi senza valore vengono omesse:
// ad esempio sulla prima pagina mancano previous/previous_url, sull'ultima next/next_url.
export interface PaginationMeta {
  count: number;  // Numero totale dei record provenienti dal Backend
  limit: number;  // Numero di record per richiesta (impostabile tramite ?limit=...)
  page: number;   // Numero corrente di pagina
  pages: number;  // Numero totale di pagine
  previous?: number;  // Numero di pagina precedente
  next?: number;      // Numero di pagina successivo
  previous_url?: string; // URL per raggiungere la precedente pagina
  next_url?: string;     // URL per raggiungere la prossima pagina
}
