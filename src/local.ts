import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { discoverFeatures } from "./spine/discovery.ts";
import { MemoryStore } from "./spine/store.ts";
import { Router } from "./spine/router.ts";
import { boardPage, renderCards } from "./board.ts";
import type { TablaRequest } from "./spine/types.ts";

/**
 * Local development server. `npm run dev` and open http://localhost:3000.
 * The deployed Lambda handler wraps the same Router; this file is only the
 * local HTTP shell around it.
 */

const FEATURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "features",
);
const SESSION_ID = process.env["TABLA_SESSION"] ?? "local-dev";
const TITLE = process.env["TABLA_TITLE"] ?? "tabla · local dev";
const PORT = Number(process.env["PORT"] ?? 3000);

const { features, errors } = await discoverFeatures(FEATURES_DIR);
for (const e of errors) {
  console.error(`[discovery] SKIPPED features/${e.dir}: ${e.reason}`);
}
console.log(
  `[tabla] ${features.length} feature(s): ${features.map((f) => f.name).join(", ") || "(none)"}`,
);

const store = new MemoryStore();
const router = new Router(features, store);

const METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  // Stable anonymous caller id via cookie.
  let callerId =
    req.headers.cookie?.match(/tabla_caller=([\w-]+)/)?.[1] ?? "";
  const setCookie = callerId === "";
  if (setCookie) callerId = randomUUID();

  if (url === "/" || url === "/index.html") {
    const cards = await renderCards(features, SESSION_ID, store);
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      ...(setCookie ? { "set-cookie": `tabla_caller=${callerId}; Path=/` } : {}),
    });
    res.end(boardPage(TITLE, SESSION_ID, cards));
    return;
  }

  // Cards fragment - polled by the board page for live updates.
  if (url === "/cards") {
    const cards = await renderCards(features, SESSION_ID, store);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(cards.join("\n"));
    return;
  }

  if (!METHODS.has(method)) {
    res.writeHead(405, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "method not allowed" }));
    return;
  }

  let body: unknown;
  if (method === "POST" || method === "PUT") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf-8");
    if (raw.length > 0) {
      try {
        body = JSON.parse(raw);
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "body is not valid JSON" }));
        return;
      }
    }
  }

  const response = await router.dispatch(
    method as TablaRequest["method"],
    url,
    body,
    callerId,
  );
  res.writeHead(response.status, {
    "content-type": "application/json; charset=utf-8",
    ...(setCookie ? { "set-cookie": `tabla_caller=${callerId}; Path=/` } : {}),
  });
  res.end(JSON.stringify(response.body));
});

server.listen(PORT, () => {
  console.log(`[tabla] board on http://localhost:${PORT} (session: ${SESSION_ID})`);
});

