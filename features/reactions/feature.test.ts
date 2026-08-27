import { test } from "node:test";
import assert from "node:assert/strict";
import { Router } from "../../src/spine/router.ts";
import { MemoryStore } from "../../src/spine/store.ts";
import reactions from "./feature.ts";

function setup() {
  return new Router([reactions], new MemoryStore());
}

const S = "sess-1";

test("first reaction counts, repeat press is idempotent", async () => {
  const r = setup();
  const first = await r.dispatch("POST", "/api/reactions", { session: S, emoji: "🔥" }, "alice");
  assert.equal(first.status, 201);

  const repeat = await r.dispatch("POST", "/api/reactions", { session: S, emoji: "🔥" }, "alice");
  assert.equal(repeat.status, 200);
  assert.deepEqual(repeat.body, { ok: true, counted: false });

  const counts = await r.dispatch("GET", `/api/reactions?session=${S}`, undefined, "alice");
  assert.equal((counts.body as Record<string, number>)["🔥"], 1);
});

test("different callers each count once", async () => {
  const r = setup();
  await r.dispatch("POST", "/api/reactions", { session: S, emoji: "👍" }, "alice");
  await r.dispatch("POST", "/api/reactions", { session: S, emoji: "👍" }, "bob");
  const counts = await r.dispatch("GET", `/api/reactions?session=${S}`, undefined, "x");
  assert.equal((counts.body as Record<string, number>)["👍"], 2);
});

test("disallowed emoji is rejected and not stored", async () => {
  const r = setup();
  const res = await r.dispatch("POST", "/api/reactions", { session: S, emoji: "💣" }, "alice");
  assert.equal(res.status, 400);
  const counts = await r.dispatch("GET", `/api/reactions?session=${S}`, undefined, "alice");
  assert.deepEqual(Object.values(counts.body as Record<string, number>), [0, 0, 0, 0, 0]);
});

test("missing session is a 400 on both routes", async () => {
  const r = setup();
  const post = await r.dispatch("POST", "/api/reactions", { emoji: "👍" }, "a");
  assert.equal(post.status, 400);
  const get = await r.dispatch("GET", "/api/reactions", undefined, "a");
  assert.equal(get.status, 400);
});

test("sessions are isolated", async () => {
  const r = setup();
  await r.dispatch("POST", "/api/reactions", { session: "one", emoji: "🐢" }, "alice");
  const other = await r.dispatch("GET", "/api/reactions?session=two", undefined, "alice");
  assert.equal((other.body as Record<string, number>)["🐢"], 0);
});

test("card renders interactive buttons with counts", async () => {
  const store = new MemoryStore();
  const r = new Router([reactions], store);
  await r.dispatch("POST", "/api/reactions", { session: S, emoji: "🤯" }, "alice");
  const html = await reactions.card!(S, store);
  assert.match(html, /🤯<span>1<\/span>/);
  assert.match(html, /tabla\.post\('\/api\/reactions'/);
});
