export interface ApiResponse<T> {
  success: boolean; // Flag che indica il successo o meno della richiesta
  message?: string; // Eventuale messaggio inviato da Backend in risposta ad una richiesta (non sempre presente)
  data: T;          // Tipo di dato della rispota (es. Product[], Product, ...)
  meta?: PaginationMeta;  // Tipo di dato per i meta della paginazione (se presente)
  errors?: string[];  // Array di errori (stringhe) descrittive dell'eventuale errore verificatosi
}

export interface PaginationMeta {
  count: number;  // Numero totale dei record provenienti dal Backend
  limit: number;  // Numero di record per richiesta (impostabile tramite ?limit=...)
  page: number;   // Numero corrente di pagina
  next: number;   // Numero di pagina successivo
  prev: number;   // Numero di pagina precedente
  next_url: string; // URL per raggiungere la prossima pagina
  prev_url: string; // URL per raggiungere la precedente pagina
}
