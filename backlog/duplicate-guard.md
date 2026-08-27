# Board: first-come claims (duplicate-guard)

The room needs a fair way to claim things - lightning-talk slots, pizza
preferences, the aux cable. First come, first served, no arguments.

**Your spec must answer:**

- Two phones tap "claim" in the same millisecond. Exactly one wins. Which
  store verb makes that a guarantee instead of a hope? (This issue IS
  that question - the architecture section gives you the vocabulary.)
- Can a claim be released? By whom?
- What does the loser see?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
