import { test } from "node:test";
import assert from "node:assert/strict";
import { Router, matchPath } from "./router.ts";
import { MemoryStore } from "./store.ts";
import type { Feature } from "./types.ts";

const echo: Feature = {
  name: "echo",
  description: "echoes what it gets",
  routes: [
    {
      method: "GET",
      path: "/:thing",
      handler: async (req) => ({
        status: 200,
        body: { thing: req.params["thing"], q: req.query["q"] ?? null },
      }),
    },
    {
      method: "POST",
      path: "/",
      handler: async (req) => ({ status: 201, body: req.body }),
    },
  ],
};

const crasher: Feature = {
  name: "crasher",
  description: "always throws",
  routes: [
    {
      method: "GET",
      path: "/",
      handler: async () => {
        throw new Error("intentional");
      },
    },
  ],
};

function router(): Router {
  return new Router([echo, crasher], new MemoryStore());
}

test("dispatches to the right feature and captures params + query", async () => {
  const res = await router().dispatch("GET", "/api/echo/banana?q=7", undefined, "c1");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { thing: "banana", q: "7" });
});

test("POST body is passed through", async () => {
  const res = await router().dispatch("POST", "/api/echo", { a: 1 }, "c1");
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { a: 1 });
});

test("unknown feature is a 404, not a crash", async () => {
  const res = await router().dispatch("GET", "/api/nope", undefined, "c1");
  assert.equal(res.status, 404);
});

test("a crashing feature returns 500 for itself only", async () => {
  const r = router();
  const crash = await r.dispatch("GET", "/api/crasher", undefined, "c1");
  assert.equal(crash.status, 500);
  const ok = await r.dispatch("GET", "/api/echo/still-alive", undefined, "c1");
  assert.equal(ok.status, 200);
});

test("matchPath: literal, param, mismatch, url-decoding", () => {
  assert.deepEqual(matchPath("/", "/"), {});
  assert.deepEqual(matchPath("/:id/votes", "/q-1/votes"), { id: "q-1" });
  assert.equal(matchPath("/:id/votes", "/q-1"), null);
  assert.equal(matchPath("/a", "/b"), null);
  assert.deepEqual(matchPath("/:name", "/two%20words"), { name: "two words" });
});

test("MemoryStore: put/get/query/delete/putIfAbsent", async () => {
  const s = new MemoryStore();
  await s.put("PK", "B#2", { v: 2 });
  await s.put("PK", "B#1", { v: 1 });
  await s.put("PK", "A#1", { v: 0 });

  assert.deepEqual(await s.get("PK", "B#1"), { v: 1 });
  assert.equal(await s.get("PK", "missing"), undefined);

  // prefix query, sorted by sk
  assert.deepEqual(await s.query("PK", "B#"), [{ v: 1 }, { v: 2 }]);
  assert.deepEqual(await s.query("OTHER", "B#"), []);

  // conditional put
  assert.equal(await s.putIfAbsent("PK", "B#1", { v: 99 }), false);
  assert.deepEqual(await s.get("PK", "B#1"), { v: 1 });
  assert.equal(await s.putIfAbsent("PK", "C#1", { v: 3 }), true);

  await s.delete("PK", "B#1");
  assert.equal(await s.get("PK", "B#1"), undefined);
});

test("MemoryStore: returned items are copies, not live references", async () => {
  const s = new MemoryStore();
  await s.put("PK", "X", { n: 1 });
  const item = (await s.get("PK", "X"))!;
  item["n"] = 999;
  assert.deepEqual(await s.get("PK", "X"), { n: 1 });
});
