# Board: rating distribution (rating-sparkline)

An average hides the story. A 3.0 from "all threes" and a 3.0 from "half
ones, half fives" are different rooms - show the shape, not just the
number.

**Your spec must answer:**

- Where does rating data come from? You depend on another team's feature
  - what do you do while it does not exist yet, and how do you
  coordinate the data shape with them?
- How do you draw bars in a card that is just an HTML string? (No
  frameworks arrive by magic here - check how existing cards render.)
- What does the card show with zero ratings? With one?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
