# Board: quick poll (quick-poll)

The facilitator asks the room to decide something - "coffee break now or
in twenty minutes?" - and instead of a show of hands nobody can count,
everyone taps an option on their phone. The board shows the bars moving
live as votes land. Thirty seconds later the room has an answer with a
number on it.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - one button per option, calling
your API with `window.tabla.post()`. The reactions feature's buttons show
the pattern; copy it. You are building a route that records votes, a way
for the facilitator to set the question and its options, and a card that
collects taps and draws the bars.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- One vote per person - and can they change their mind? Which store verb
  gives you the semantics you chose?
- Where do the question and options come from, and what does the card
  show before any question is set?
- How do you draw a bar chart in a card that is just an HTML string?
  (Look at how existing cards render before inventing anything.)

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
