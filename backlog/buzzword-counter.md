# Board: buzzword counter (buzzword-counter)

Every room has them: the words that keep coming back. "AI." "Agentic."
"At scale." Your feature puts a scoreboard on the projector: a button per
buzzword, and every time the speaker says one, anyone in the room taps
it. Unlike reactions - where each person counts once - every single tap
counts here. Fifty taps on "AI" by the same delighted person? Fifty
points for "AI". By the afternoon the board is a running joke the whole
room is in on.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - one button per buzzword,
calling your API with `window.tabla.post()`. The reactions buttons show
the pattern - but read them closely, because reactions deliberately
counts each person ONCE per emoji, and your spec is the opposite: every
tap lands. That difference is the whole design question.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Every tap must count, including two taps from the same phone in the
  same second. What must be true about your sort keys for no tap to
  overwrite another? (The Architecture section gives you the vocabulary.)
- Where does the buzzword list come from - hardcoded, or settable? What
  does each choice cost?
- A thousand taps later: what does your counting read look like, and
  when does it get slow? (It is fine if the answer is "fine for one
  workshop" - but the README should SAY it.)

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
