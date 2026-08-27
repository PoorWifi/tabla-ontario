# Board: activity ticker (live-ticker)

The facilitator glances at the board and wants the room's pulse: what
happened in the last minute?

**Your spec must answer:**

- You are reading data OTHER features wrote. What can you count on about
  their items, and what happens to your ticker when a future feature
  stores something you never saw? (The shared-table section of the
  architecture is required reading.)
- What is "the last minute" measured against, and what do you show when
  nothing happened?
- Read-only features still need tests. Through what interface?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
