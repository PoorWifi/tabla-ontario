# Board: session data export (csv-export)

After the event, the facilitator wants everything the session collected
in a file a spreadsheet can open.

**Your spec must answer:**

- Your feature reads data OTHER features wrote. What can you actually
  rely on about its shape? (The architecture section on the shared table
  is the map.)
- CSV looks trivial until a value contains a comma, a quote, or a
  newline - people type all three. What is your escaping story, and
  where is its test?
- Export of WHAT exactly - raw items? One row per what?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
