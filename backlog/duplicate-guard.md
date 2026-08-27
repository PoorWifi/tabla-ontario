# Board: first-come claims (duplicate-guard)

Five lightning-talk slots. Thirty people. The facilitator says "slots
are open - claim one!" and thirty thumbs hit thirty phones at the same
moment. Exactly five people must win, exactly one per slot, and the
losers must see who beat them - instantly, with no arguing about who
tapped first. First come, first served, enforced by the database rather
than by shouting.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a claim button per slot,
calling your API with `window.tabla.post()`. The reactions feature's
buttons show the pattern; copy it. You are building a route that awards
each claim to exactly one caller, and a card that shows what is claimed,
by whom, and what is still free.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Two phones tap "claim" in the same millisecond. Exactly one wins. Which
  store verb makes that a GUARANTEE instead of a hope? (This issue IS
  that question - the Architecture section gives you the vocabulary.)
- Can a claim be released? By whom?
- What does the loser see?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
