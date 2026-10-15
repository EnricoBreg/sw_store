// Server statico minimale per la build localizzata (dist/frontend/browser/{it,en}).
// Serve /it/ e /en/ con fallback SPA su index.html della lingua; gli altri percorsi
// vengono reindirizzati alla lingua di default (it). Usato dagli E2E di i18n.
//   node e2e/serve-dist.mjs            (porta 4200, l'unica ammessa dal CORS del backend)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist/frontend/browser", import.meta.url)));
const port = Number(process.env.PORT ?? 4200);
const locales = ["it", "en"];
const defaultLocale = "it";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function send(res, path, status = 200) {
  const body = await readFile(path);
  res.writeHead(status, { "Content-Type": contentTypes[extname(path)] ?? "application/octet-stream" });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const [, locale] = url.pathname.split("/");

    if (!locales.includes(locale)) {
      res.writeHead(302, { Location: `/${defaultLocale}${url.pathname === "/" ? "/" : url.pathname}${url.search}` });
      return res.end();
    }

    // Percorso del file richiesto, senza uscire dalla cartella della build
    const filePath = normalize(join(root, decodeURIComponent(url.pathname)));
    if (filePath.startsWith(root) && (await isFile(filePath))) {
      return await send(res, filePath);
    }

    // Fallback SPA: le rotte di Angular vengono servite dall'index.html della lingua
    await send(res, join(root, locale, "index.html"));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(String(error));
  }
});

server.listen(port, () => {
  console.log(`Build localizzata servita su http://localhost:${port}/ (it, en)`);
});
