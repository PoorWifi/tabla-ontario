# Board: session rating (average-rating)

Halfway through the afternoon, the facilitator wants to know: is this
landing? Everyone taps a number from 1 to 5 on their phone, and the board
shows how the room feels right now. No forms after the event, no "please
fill the survey" email nobody answers - the pulse, live, while there is
still time to change course.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - five buttons (1 to 5) that
call your API with `window.tabla.post()` is all it takes. The reactions
feature's emoji buttons work exactly this way; copy that pattern. You are
building an API route that stores each person's rating, and a card that
both collects the taps and shows the result.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- One rating per person, or can they re-rate? If they re-rate, which
  number counts?
- What does the card show - the average alone? The count? Is a 5.0 from
  two votes the same story as a 4.2 from forty?
- What arrives in the request that you must refuse? (A rating of 7? Of
  "five"? Of -1?)

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
