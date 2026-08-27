import type { Feature, Store } from "./spine/types.ts";

/** Board page rendering, shared by the local server and the Lambda handler. */

export async function renderCards(
  features: Feature[],
  sessionId: string,
  store: Store,
): Promise<string[]> {
  return Promise.all(
    features
      .filter((f) => f.card)
      .map(async (f) => {
        try {
          return await f.card!(sessionId, store);
        } catch {
          return `<section class="card error">feature "${f.name}" card crashed</section>`;
        }
      }),
  );
}

/**
 * The board page. Product-voiced: this is what the room sees, so it speaks
 * to participants, not developers. Developer copy lives in the README.
 *
 * The spine provides a tiny client contract to feature cards:
 *   window.tabla.session      - the current session id
 *   window.tabla.post(p, b)   - JSON POST + immediate card refresh
 * Cards re-render every few seconds via GET /cards (fragment swap), so an
 * interactive card stays a plain HTML string - no framework, no build step.
 */
export function boardPage(
  title: string,
  sessionId: string,
  cards: string[],
): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { --bg:#0a0a0c; --panel:#15151b; --line:#2a2a33; --text:#ececf1; --dim:#9a9aa5; --accent:#ffb100; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--text); }
  header, main, footer { max-width: 720px; margin: 0 auto; padding: 0 1.25rem; }
  header { padding-top: 2.5rem; }
  .kicker { color: var(--accent); font-family: ui-monospace, monospace; font-size: 0.8rem; letter-spacing: 0.18em; }
  h1 { margin: 0.35rem 0 0.25rem; font-size: clamp(1.6rem, 5vw, 2.4rem); }
  .sub { margin: 0 0 1.5rem; color: var(--dim); }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 1.25rem 1.25rem 1.35rem; margin: 0 0 1rem; }
  .card h2 { margin: 0 0 0.75rem; font-size: 1.05rem; }
  .card.error { border-color: #a33; color: #f88; }
  .react-row { display: flex; flex-wrap: wrap; gap: 0.6rem; }
  button.react { font-size: 1.35rem; padding: 0.55rem 0.9rem; border-radius: 12px; border: 1px solid var(--line); background: transparent; color: var(--text); cursor: pointer; }
  button.react:active { border-color: var(--accent); transform: scale(0.96); }
  button.react span { font-size: 0.95rem; color: var(--dim); margin-left: 0.45rem; }
  footer { padding: 1.5rem 1.25rem 2.5rem; color: var(--dim); font-size: 0.85rem; }
  footer code, h1 code { color: var(--accent); font-family: ui-monospace, monospace; background: none; }
  code { background: #1c1c22; padding: 0.1em 0.35em; border-radius: 4px; }
</style>
</head>
<body>
<header>
  <div class="kicker">● LIVE</div>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">Tap to participate - everything updates live for the whole room.</p>
</header>
<main id="cards">
${cards.join("\n")}
</main>
<footer>powered by <code>tabla</code> - the open-source room board, built live by this room.</footer>
<script>
window.tabla = {
  session: ${JSON.stringify(sessionId)},
  post: async (path, body) => {
    await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await window.tabla.refresh();
  },
  refresh: async () => {
    const r = await fetch("/cards");
    if (r.ok) document.getElementById("cards").innerHTML = await r.text();
  },
};
setInterval(window.tabla.refresh, 4000);
</script>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
