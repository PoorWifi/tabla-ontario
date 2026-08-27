# Board: one-word check-in (word-cloud)

The room answers "how does this session feel?" with a single word each,
and the board draws the words - popular ones bigger.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Can a person change their word? What happens to the old one?
- What counts as ONE word? "very good"? An emoji? 40 characters of z?
  "constructor"?
- The board renders whatever people type. What could go wrong with that?

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
