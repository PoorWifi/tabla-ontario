import type { Feature, Store, TablaRequest, TablaResponse } from "./types.ts";

/**
 * Routes a request to the owning feature. Features are namespaced under
 * /api/<feature-name>/..., so two features can never collide on a path.
 */
export class Router {
  private features: Feature[];
  private store: Store;

  constructor(features: Feature[], store: Store) {
    this.features = features;
    this.store = store;
  }

  /** List of mounted features, for the board index. */
  list(): { name: string; description: string }[] {
    return this.features.map(({ name, description }) => ({
      name,
      description,
    }));
  }

  async dispatch(
    method: TablaRequest["method"],
    url: string,
    body: unknown,
    callerId: string,
  ): Promise<TablaResponse> {
    const parsed = new URL(url, "http://tabla.local");
    const segments = parsed.pathname.split("/").filter(Boolean);

    // Expected shape: api / <feature> / ...rest
    if (segments[0] !== "api" || segments.length < 2) {
      return { status: 404, body: { error: "not found" } };
    }
    const feature = this.features.find((f) => f.name === segments[1]);
    if (!feature) {
      return { status: 404, body: { error: `no feature "${segments[1]}"` } };
    }

    const rest = "/" + segments.slice(2).join("/");
    for (const route of feature.routes) {
      if (route.method !== method) continue;
      const params = matchPath(route.path, rest);
      if (!params) continue;

      const query: Record<string, string> = {};
      for (const [k, v] of parsed.searchParams) query[k] = v;

      try {
        return await route.handler(
          { method, path: rest, params, query, body, callerId },
          this.store,
        );
      } catch (err) {
        // A feature bug returns a 500 for that feature only; the board and
        // every other feature keep running.
        return {
          status: 500,
          body: {
            error: `feature "${feature.name}" crashed`,
            detail: err instanceof Error ? err.message : String(err),
          },
        };
      }
    }
    return { status: 404, body: { error: "no matching route" } };
  }
}

/**
 * Match a route pattern like "/:id/votes" against a concrete path.
 * Returns captured params, or null when it does not match.
 */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = path.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i]!;
    const s = pathSegs[i]!;
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(s);
    } else if (p !== s) {
      return null;
    }
  }
  return params;
}
