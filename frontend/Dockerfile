# syntax=docker/dockerfile:1
# Frontend SW Store: build di produzione (it + en) con Node, poi servita da nginx.
#
#   docker build -t sw-store-frontend --build-arg API_URL=http://localhost:3000/api/v1 .
#   docker run -p 4200:80 sw-store-frontend      → http://localhost:4200/it/ e /en/
#
# Limite: l'URL dell'API è fissato al momento della build (i18n e configurazione sono a build time);
# per cambiarlo serve una nuova build con un altro API_URL. È l'URL usato dal browser, quindi deve
# essere raggiungibile dal computer dell'utente (non il nome del servizio nella rete di Docker).

# --- Build ---
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG API_URL=http://localhost:3000/api/v1
# Unico punto di configurazione dell'URL del backend: src/environments/environment.ts
RUN sed -i "s#apiUrl: \".*\"#apiUrl: \"${API_URL}\"#" src/environments/environment.ts \
  && grep -q "apiUrl: \"${API_URL}\"" src/environments/environment.ts \
  && npx ng build

# --- Runtime ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
