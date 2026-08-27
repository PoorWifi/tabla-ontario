# Board: help queue (help-queue)

A team is stuck. The facilitator is across the room helping someone
else. Instead of a raised arm slowly going numb, the team taps "we need
help" on their phone with their table number - and the board shows the
queue: who is waiting, and for how long. The facilitator glances up,
works the queue in order, and marks each one done. You would be building
the tool this very workshop uses tomorrow.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a "we need help" input plus a
"done" button per queue entry, calling your API with
`window.tabla.post()`. The reactions buttons show the pattern; copy it.
You are building routes that add and resolve requests, and a card that
shows the live queue with waiting times.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Resolving a request removes it from the queue - which store verb does
  removal, and what should happen if two people resolve the same entry
  at once? (No other feature on this board deletes anything. Yours does.)
- Who may mark an entry done, given that tabla has no auth by design?
  What do you choose, and what do you write in the README about it?
- The same team taps "we need help" three times. One queue entry or
  three?

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
