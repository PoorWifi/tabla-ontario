import type { Feature, Store } from "../../src/spine/types.ts";

/**
 * Worked example feature: an emoji reaction bar.
 *
 * Demonstrates the three things almost every feature needs:
 *   1. a write route  (POST /api/reactions)
 *   2. a read route   (GET  /api/reactions)
 *   3. a board card   (aggregated counts on the projector)
 *
 * Store layout (see AGENTS.md for the key convention):
 *   pk = SESSION#<sessionId>
 *   sk = REACTION#<emoji>#<callerId>   -> { emoji, at }
 *
 * Keying by callerId means one reaction per person per emoji: pressing 🔥
 * twice is idempotent, not double-counted. putIfAbsent makes that a
 * guarantee instead of a hope.
 */

const ALLOWED = ["👍", "🔥", "🤯", "❓", "🐢"] as const;
type Emoji = (typeof ALLOWED)[number];

const SESSION = (id: string) => `SESSION#${id}`;

async function counts(sessionId: string, store: Store): Promise<Record<Emoji, number>> {
  const items = await store.query(SESSION(sessionId), "REACTION#");
  const result = Object.fromEntries(ALLOWED.map((e) => [e, 0])) as Record<Emoji, number>;
  for (const item of items) {
    const emoji = item["emoji"] as Emoji;
    if (emoji in result) result[emoji] += 1;
  }
  return result;
}

const feature: Feature = {
  name: "reactions",
  description: "React to the current session with an emoji.",
  routes: [
    {
      method: "POST",
      path: "/",
      handler: async (req, store) => {
        const body = req.body as { session?: string; emoji?: string } | undefined;
        const sessionId = body?.session;
        const emoji = body?.emoji;
        if (!sessionId || typeof sessionId !== "string") {
          return { status: 400, body: { error: "missing session" } };
        }
        if (!emoji || !(ALLOWED as readonly string[]).includes(emoji)) {
          return {
            status: 400,
            body: { error: `emoji must be one of ${ALLOWED.join(" ")}` },
          };
        }
        const fresh = await store.putIfAbsent(
          SESSION(sessionId),
          `REACTION#${emoji}#${req.callerId}`,
          { emoji, at: new Date().toISOString() },
        );
        return { status: fresh ? 201 : 200, body: { ok: true, counted: fresh } };
      },
    },
    {
      method: "GET",
      path: "/",
      handler: async (req, store) => {
        const sessionId = req.query["session"];
        if (!sessionId) {
          return { status: 400, body: { error: "missing ?session=" } };
        }
        return { status: 200, body: await counts(sessionId, store) };
      },
    },
  ],
  card: async (sessionId, store) => {
    const c = await counts(sessionId, store);
    // Interactive card: the board page provides window.tabla.post() and
    // tabla.session to card HTML - tap a button, everyone's count moves.
    const buttons = ALLOWED.map(
      (e) =>
        `<button class="react" onclick="tabla.post('/api/reactions',{session:tabla.session,emoji:'${e}'})">${e}<span>${c[e]}</span></button>`,
    ).join("");
    return `<section class="card"><h2>Reactions</h2><div class="react-row">${buttons}</div></section>`;
  },
};

export default feature;
