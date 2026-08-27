import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "./lambda.ts";
import { MemoryStore } from "./spine/store.ts";

// Function URL payload v2 event mapping, tested with an injected MemoryStore.
function event(overrides: Record<string, unknown>) {
  return {
    rawPath: "/",
    requestContext: { http: { method: "GET" } },
    ...overrides,
  } as Parameters<ReturnType<typeof createHandler>>[0];
}

test("GET / renders the board and sets the caller cookie", async () => {
  const h = createHandler(new MemoryStore(), "s1", "My Event");
  const res = await h(event({}));
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"]!, /text\/html/);
  assert.ok(res.cookies?.[0]?.startsWith("tabla_caller="));
  assert.match(res.body, /<h1>My Event<\/h1>/);
  assert.match(res.body, /Tap to participate/);
  // The client contract the cards rely on:
  assert.match(res.body, /window\.tabla/);
  assert.match(res.body, /session: "s1"/);
});

test("GET /cards returns just the card fragments for live refresh", async () => {
  const h = createHandler(new MemoryStore(), "s1");
  const res = await h(event({ rawPath: "/cards" }));
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /class="card"/);
  assert.doesNotMatch(res.body, /<html/);
});

test("existing cookie is honoured - no Set-Cookie, stable identity", async () => {
  const h = createHandler(new MemoryStore(), "s1");
  const post = (id: string) =>
    h(
      event({
        rawPath: "/api/reactions",
        requestContext: { http: { method: "POST" } },
        cookies: [`tabla_caller=${id}`],
        body: JSON.stringify({ session: "s1", emoji: "🔥" }),
      }),
    );
  const first = await post("caller-a");
  assert.equal(first.statusCode, 201);
  assert.equal(first.cookies, undefined);
  const repeat = await post("caller-a");
  assert.equal(repeat.statusCode, 200); // idempotent, same person
});

test("base64 body is decoded", async () => {
  const h = createHandler(new MemoryStore(), "s1");
  const res = await h(
    event({
      rawPath: "/api/reactions",
      requestContext: { http: { method: "POST" } },
      body: Buffer.from(
        JSON.stringify({ session: "s1", emoji: "👍" }),
      ).toString("base64"),
      isBase64Encoded: true,
    }),
  );
  assert.equal(res.statusCode, 201);
});

test("query string reaches the feature", async () => {
  const h = createHandler(new MemoryStore(), "s1");
  const res = await h(
    event({ rawPath: "/api/reactions", rawQueryString: "session=s1" }),
  );
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /🔥/);
});

test("invalid JSON body is a 400", async () => {
  const h = createHandler(new MemoryStore(), "s1");
  const res = await h(
    event({
      rawPath: "/api/reactions",
      requestContext: { http: { method: "POST" } },
      body: "{not json",
    }),
  );
  assert.equal(res.statusCode, 400);
});
