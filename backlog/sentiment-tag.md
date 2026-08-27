# Board: sentiment tag (sentiment-tag)

The facilitator asks the room: "how is it going, in a sentence?" People
type honest little sentences on their phones - "loving the pace",
"lost since the second exercise" - and next to each one the board shows
🙂, 😐, or 🙁. Nobody reads forty sentences from a projector, but a
column of faces tells the story in one glance: mostly 🙂 with a cluster
of 🙁? Somebody is being left behind. And your scorer must be simple
enough to explain on one slide - this is a demo of a pure function, not
machine learning.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a text input that calls your
API with `window.tabla.post()` is the whole collection mechanism. The
reactions feature's buttons show the pattern; copy it. You are building a
scoring function, a route that applies it, and a card that collects
sentences and shows the faces.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- What is your scoring approach, and where does it break? ("not good" -
  what does your scorer say?) Your README owns the disclaimer.
- "goodness" contains "good". How does matching work?
- Pure function or stored results? What does each choice cost?

Read the Architecture section of the README before deciding where your
data lives - if it lives anywhere at all.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
