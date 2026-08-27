import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { discoverFeatures } from "./discovery.ts";

const REAL_FEATURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "features",
);

/** Build a throwaway features dir with the given feature.ts sources. */
async function fixture(
  features: Record<string, string>,
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "tabla-disc-"));
  for (const [name, source] of Object.entries(features)) {
    await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, name, "feature.ts"), source);
  }
  return root;
}

const VALID = (name: string) => `
const feature = {
  name: ${JSON.stringify(name)},
  description: "a valid test feature",
  routes: [
    {
      method: "GET",
      path: "/",
      handler: async () => ({ status: 200, body: { ok: true } }),
    },
  ],
};
export default feature;
`;

test("discovers a valid feature", async () => {
  const dir = await fixture({ alpha: VALID("alpha") });
  const { features, errors } = await discoverFeatures(dir);
  assert.equal(errors.length, 0);
  assert.equal(features.length, 1);
  assert.equal(features[0]!.name, "alpha");
});

test("features come back sorted by name", async () => {
  const dir = await fixture({
    zeta: VALID("zeta"),
    alpha: VALID("alpha"),
    mid: VALID("mid"),
  });
  const { features } = await discoverFeatures(dir);
  assert.deepEqual(
    features.map((f) => f.name),
    ["alpha", "mid", "zeta"],
  );
});

test("a broken feature is reported by directory name and does not block others", async () => {
  const dir = await fixture({
    good: VALID("good"),
    broken: `throw new Error("boom at import time");`,
  });
  const { features, errors } = await discoverFeatures(dir);
  assert.equal(features.length, 1);
  assert.equal(features[0]!.name, "good");
  assert.equal(errors.length, 1);
  assert.equal(errors[0]!.dir, "broken");
  assert.match(errors[0]!.reason, /failed to load/);
});

test("missing default export is rejected with a clear reason", async () => {
  const dir = await fixture({
    noexport: `export const feature = { name: "noexport" };`,
  });
  const { errors } = await discoverFeatures(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.reason, /no default export/);
});

test("name must match the directory", async () => {
  const dir = await fixture({ dirname: VALID("othername") });
  const { features, errors } = await discoverFeatures(dir);
  assert.equal(features.length, 0);
  assert.match(errors[0]!.reason, /must equal the directory name/);
});

test("malformed routes are rejected", async () => {
  const dir = await fixture({
    badroutes: `
export default {
  name: "badroutes",
  description: "routes entry missing handler",
  routes: [{ method: "GET", path: "/" }],
};
`,
  });
  const { errors } = await discoverFeatures(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.reason, /routes\[0\] is malformed/);
});

test("underscore and dot directories are skipped", async () => {
  const dir = await fixture({
    _templates: `this is not even valid typescript`,
    real: VALID("real"),
  });
  const { features, errors } = await discoverFeatures(dir);
  assert.equal(errors.length, 0);
  assert.deepEqual(
    features.map((f) => f.name),
    ["real"],
  );
});

test("missing features directory fails closed", async () => {
  const { features, errors } = await discoverFeatures("/nonexistent-tabla");
  assert.equal(features.length, 0);
  assert.equal(errors.length, 1);
});

// The gate: the repo's real features/ directory must always load cleanly.
// This is the test that makes "a broken feature cannot merge" true.
test("GATE: every feature in features/ loads without errors", async () => {
  const { features, errors } = await discoverFeatures(REAL_FEATURES);
  assert.deepEqual(
    errors,
    [],
    `broken features: ${errors.map((e) => `${e.dir}: ${e.reason}`).join("; ")}`,
  );
  assert.ok(features.length >= 1, "expected at least the worked example");
});
