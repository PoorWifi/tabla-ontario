import { randomUUID } from "node:crypto";
import { Router } from "./spine/router.ts";
import { DynamoDbStore } from "./spine/dynamo-store.ts";
import { boardPage, renderCards } from "./board.ts";
import { features } from "./manifest.gen.ts";
import type { Store, TablaRequest } from "./spine/types.ts";

/**
 * Lambda handler behind a Function URL (payload v2). Cold start does no
 * discovery - features come from the build-time manifest.
 *
 * NOTE: the Function URL uses AuthType NONE - the board is deliberately a
 * public, unauthenticated endpoint (workshop room traffic). Do not store
 * anything sensitive in it, and tear it down after the event.
 */

const TABLE = process.env["TABLE_NAME"] ?? "";
const SESSION_ID = process.env["TABLA_SESSION"] ?? "workshop";
const TITLE = process.env["TABLA_TITLE"] ?? "tabla";

const METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

interface UrlEvent {
  rawPath: string;
  rawQueryString?: string;
  cookies?: string[];
  body?: string;
  isBase64Encoded?: boolean;
  requestContext: { http: { method: string } };
}

interface UrlResponse {
  statusCode: number;
  headers: Record<string, string>;
  cookies?: string[];
  body: string;
}

/** Factory so tests can inject a MemoryStore; prod injects DynamoDbStore. */
export function createHandler(
  store: Store,
  sessionId: string = SESSION_ID,
  title: string = TITLE,
): (event: UrlEvent) => Promise<UrlResponse> {
  const router = new Router(features, store);

  return async function handler(event: UrlEvent): Promise<UrlResponse> {
    const method = event.requestContext.http.method;
    const path = event.rawPath || "/";

    let callerId =
      event.cookies
        ?.map((c) => c.match(/^tabla_caller=([\w-]+)$/)?.[1])
        .find(Boolean) ?? "";
    const setCookie = callerId === "";
    if (setCookie) callerId = randomUUID();
    const cookieOut = setCookie
      ? { cookies: [`tabla_caller=${callerId}; Path=/; SameSite=Lax`] }
      : {};

    if (method === "GET" && (path === "/" || path === "/index.html")) {
      const cards = await renderCards(features, sessionId, store);
      return {
        statusCode: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        ...cookieOut,
        body: boardPage(title, sessionId, cards),
      };
    }

    // Cards fragment - polled by the board page for live updates.
    if (method === "GET" && path === "/cards") {
      const cards = await renderCards(features, sessionId, store);
      return {
        statusCode: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        ...cookieOut,
        body: cards.join("\n"),
      };
    }

    if (!METHODS.has(method)) {
      return json(405, { error: "method not allowed" }, cookieOut);
    }

    let body: unknown;
    if (event.body) {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : event.body;
      try {
        body = JSON.parse(raw);
      } catch {
        return json(400, { error: "body is not valid JSON" }, cookieOut);
      }
    }

    const url = event.rawQueryString
      ? `${path}?${event.rawQueryString}`
      : path;
    const response = await router.dispatch(
      method as TablaRequest["method"],
      url,
      body,
      callerId,
    );
    return json(response.status, response.body, cookieOut);
  };
}

/** The deployed entry point. */
export const handler = createHandler(new DynamoDbStore(TABLE));

function json(
  statusCode: number,
  payload: unknown,
  extra: { cookies?: string[] },
): UrlResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    ...extra,
    body: JSON.stringify(payload),
  };
}
