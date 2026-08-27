/**
 * The feature contract. This is the whole API between your feature and tabla.
 *
 * A feature is a directory under features/ containing a feature.ts that
 * default-exports a Feature object. The spine finds it, validates it, and
 * mounts its routes. You never edit a shared registry file.
 */

/** Incoming request, already parsed. */
export interface TablaRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path relative to the feature mount, e.g. "/" or "/:id/votes". */
  path: string;
  /** Path parameters captured from :param segments. */
  params: Record<string, string>;
  /** Query string parameters. */
  query: Record<string, string>;
  /** Parsed JSON body, or undefined when there is none. */
  body: unknown;
  /** Anonymous-but-stable caller id (one per browser session). */
  callerId: string;
}

/** What a route handler returns. */
export interface TablaResponse {
  status: number;
  body: unknown;
}

/** One HTTP route your feature exposes, mounted under /api/<feature-name>. */
export interface Route {
  method: TablaRequest["method"];
  /** e.g. "/" or "/:questionId/votes" */
  path: string;
  handler: (req: TablaRequest, store: Store) => Promise<TablaResponse>;
}

/**
 * Key-value store shared by all features. Backed by memory locally and
 * DynamoDB (single table) when deployed - same interface, no code change.
 *
 * Convention for keys, matching the deployed table:
 *   pk: "SESSION#<sessionId>"
 *   sk: "<TYPE>#<discriminator>"  e.g. "FEEDBACK#2026-08-21T20:00:00Z#abc1"
 */
export interface Store {
  put(pk: string, sk: string, item: Record<string, unknown>): Promise<void>;
  /** Write only if (pk, sk) does not exist yet. Returns false if it did. */
  putIfAbsent(
    pk: string,
    sk: string,
    item: Record<string, unknown>,
  ): Promise<boolean>;
  get(pk: string, sk: string): Promise<Record<string, unknown> | undefined>;
  /** All items under pk whose sk starts with skPrefix, sorted by sk. */
  query(pk: string, skPrefix: string): Promise<Record<string, unknown>[]>;
  delete(pk: string, sk: string): Promise<void>;
}

/** What features/<name>/feature.ts must default-export. */
export interface Feature {
  /** Must equal the directory name. Lowercase, digits, hyphens. */
  name: string;
  /** One sentence, shown on the board's feature list. */
  description: string;
  routes: Route[];
  /**
   * Optional server-rendered card for the board.
   * Return an HTML fragment; it is embedded into the board page and
   * re-rendered every few seconds. For interactivity, the page provides
   * `window.tabla.session` and `window.tabla.post(path, body)` - see the
   * reactions feature for a tap-to-react example.
   */
  card?: (sessionId: string, store: Store) => Promise<string>;
}
