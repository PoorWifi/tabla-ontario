# Board: scan-to-join (qr-code)

New arrivals should get onto the board by pointing a camera at the
projector - no typing a URL.

**Your spec must answer:**

- Where does the board's own public URL come from? (Nothing in the
  runtime hands it to you - check the architecture and decide: config?
  the store? something else?)
- Who is allowed to set or change it, given that tabla has no auth by
  design?
- What does the card show before anyone has configured it?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
