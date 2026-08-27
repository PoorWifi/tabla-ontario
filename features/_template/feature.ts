import type { Feature } from "../../src/spine/types.ts";

/**
 * TEMPLATE - copy this directory to features/<your-name>/ and edit.
 * Directories starting with "_" are ignored by discovery, so this file
 * never loads in the real app.
 */

const feature: Feature = {
  // Must equal your directory name. Lowercase, digits, hyphens.
  name: "_template",
  description: "One sentence shown on the board's feature list.",
  routes: [
    {
      method: "GET",
      path: "/",
      handler: async (req, store) => {
        // req.params  - captured :segments
        // req.query   - query string
        // req.body    - parsed JSON (POST/PUT)
        // req.callerId - stable anonymous id per browser
        // store       - see src/spine/types.ts for the key convention
        return { status: 200, body: { hello: "tabla" } };
      },
    },
  ],
  // Optional: HTML fragment for the projector board.
  // card: async (sessionId, store) => `<section class="card">…</section>`,
};

export default feature;
