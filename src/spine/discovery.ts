import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import type { Feature } from "./types.ts";

/** A feature directory that failed to load, and why. */
export interface DiscoveryError {
  dir: string;
  reason: string;
}

export interface DiscoveryResult {
  features: Feature[];
  errors: DiscoveryError[];
}

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Scan featuresDir for subdirectories containing feature.ts and load each
 * one. Nothing shared is ever edited: dropping a directory in is the whole
 * registration step.
 *
 * Fails closed per feature: a broken feature lands in `errors` with a
 * message naming the directory and the problem, and the rest still load.
 * The CI gate turns any non-empty `errors` into a failure, so a broken
 * feature cannot merge - but it also cannot take the board down locally.
 */
export async function discoverFeatures(
  featuresDir: string,
): Promise<DiscoveryResult> {
  const features: Feature[] = [];
  const errors: DiscoveryError[] = [];

  let entries;
  try {
    entries = await readdir(featuresDir, { withFileTypes: true });
  } catch {
    return {
      features,
      errors: [{ dir: featuresDir, reason: "features directory not found" }],
    };
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue; // _templates etc.
    const dir = entry.name;

    let mod: Record<string, unknown>;
    try {
      mod = await import(
        pathToFileURL(join(featuresDir, dir, "feature.ts")).href
      );
    } catch (err) {
      errors.push({
        dir,
        reason: `feature.ts failed to load: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const problem = validate(dir, mod["default"]);
    if (problem) {
      errors.push({ dir, reason: problem });
      continue;
    }

    // validate() enforced name === dir, and directory names are unique,
    // so no duplicate check is needed here.
    features.push(mod["default"] as Feature);
  }

  features.sort((a, b) => a.name.localeCompare(b.name));
  return { features, errors };
}

/** Returns a problem description, or null when the export is a valid Feature. */
function validate(dir: string, candidate: unknown): string | null {
  if (candidate === undefined) {
    return "feature.ts has no default export";
  }
  if (typeof candidate !== "object" || candidate === null) {
    return "default export is not an object";
  }
  const f = candidate as Partial<Feature>;
  if (typeof f.name !== "string" || !NAME_RE.test(f.name)) {
    return `"name" must be lowercase letters, digits, hyphens (got ${JSON.stringify(f.name)})`;
  }
  if (f.name !== dir) {
    return `"name" (${f.name}) must equal the directory name (${dir})`;
  }
  if (typeof f.description !== "string" || f.description.length === 0) {
    return `"description" must be a non-empty string`;
  }
  if (!Array.isArray(f.routes)) {
    return `"routes" must be an array`;
  }
  for (const [i, route] of f.routes.entries()) {
    if (
      typeof route !== "object" ||
      route === null ||
      !["GET", "POST", "PUT", "DELETE"].includes(route.method) ||
      typeof route.path !== "string" ||
      !route.path.startsWith("/") ||
      typeof route.handler !== "function"
    ) {
      return `routes[${i}] is malformed: need { method, path starting with "/", handler }`;
    }
  }
  if (f.card !== undefined && typeof f.card !== "function") {
    return `"card" must be a function when present`;
  }
  return null;
}
