import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { listFeatureDirs, renderManifest } from "../scripts/gen-manifest.ts";
import { discoverFeatures } from "./spine/discovery.ts";

const FEATURES = join(dirname(fileURLToPath(import.meta.url)), "..", "features");

// The Lambda bundle imports a build-time manifest instead of doing runtime
// discovery. These tests keep the two mechanisms in lockstep: what discovery
// loads locally is exactly what the manifest ships to prod.
test("PARITY: manifest dirs equal discovered feature names", async () => {
  const dirs = await listFeatureDirs(FEATURES);
  const { features, errors } = await discoverFeatures(FEATURES);
  assert.deepEqual(errors, []);
  assert.deepEqual(
    dirs,
    features.map((f) => f.name),
  );
});

test("manifest renders one import per feature and a stable list", async () => {
  const src = renderManifest(["alpha", "zeta"]);
  assert.match(src, /import f0 from "\.\.\/features\/alpha\/feature\.ts";/);
  assert.match(src, /import f1 from "\.\.\/features\/zeta\/feature\.ts";/);
  assert.match(src, /export const features: Feature\[\] = \[f0, f1\];/);
});
