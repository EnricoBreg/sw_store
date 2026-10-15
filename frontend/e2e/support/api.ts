import { APIRequestContext, expect } from "@playwright/test";

export const API_URL = process.env["E2E_API_URL"] ?? "http://localhost:3000/api/v1";

/** Login via API: restituisce il JWT dell'utente. */
export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, { data: { user: { email, password } } });
  expect(response.ok()).toBe(true);
  return response.headers()["authorization"].replace(/^Bearer\s+/, "");
}

/** Carrello dell'utente letto dal backend. */
export async function apiGetCart(request: APIRequestContext, token: string) {
  const response = await request.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${token}` } });
  expect(response.ok()).toBe(true);
  return (await response.json()).data;
}

/** Svuota il carrello dell'utente (riga per riga, con DELETE /cart/items/:id). */
export async function apiEmptyCart(request: APIRequestContext, token: string) {
  const cart = await apiGetCart(request, token);
  for (const item of cart.items) {
    await request.delete(`${API_URL}/cart/items/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
  }
}
