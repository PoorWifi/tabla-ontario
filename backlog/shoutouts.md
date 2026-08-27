# Board: shoutout wall (shoutouts)

Someone on team three just untangled team five's git mess. That deserves
to be on the projector. Your feature is the wall: type a short shoutout
on your phone - "team 5 says thanks to Priya for the rebase rescue 🙏" -
and it appears on the board for everyone to see. Positive vibes only, by
design: this wall celebrates, it does not complain (there are other
features for feedback).

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a text input calling your API
with `window.tabla.post()` is the whole mechanism. The reactions buttons
show the pattern; copy it. You are building a route that stores
shoutouts and a card that collects them and shows the wall.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- How long can a shoutout be, and what happens to an empty or
  whitespace-only one?
- The card cannot show a hundred shoutouts. How many, in what order, and
  what happens to the rest?
- People type ANYTHING, and this renders on a very large projector. Where
  exactly do you make it safe? (One of the review lanes is famously
  unforgiving about this.)

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
