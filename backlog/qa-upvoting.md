# Board: audience Q&A with upvotes (qa-upvoting)

Someone in row three has a question but does not want to interrupt.
They type it on their phone. It appears on the board. Four other people
were wondering the same thing - they tap upvote instead of typing it
again. When the facilitator pauses, the board already shows which
questions the room actually cares about, sorted by votes. The shy
question with nine upvotes beats the loud one with none.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a text input for new questions
plus an upvote button next to each listed question, all calling your API
with `window.tabla.post()`. The reactions feature's buttons show the
pattern; copy it. You are building routes that store questions and votes,
and a card that collects both and lists the winners.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Can someone upvote the same question twice? How do you make that
  impossible, not just unlikely? (The Architecture section on store verbs
  is where the answer hides.)
- How long can a question be? What happens to an empty one?
- The card cannot show everything. Which questions make the cut, in what
  order, and what breaks the tie?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
