# Board: guess the number (guess-the-number)

The facilitator asks: "how many pull requests will this room merge
today?" Everyone locks in a guess from their phone. Here is the twist
that makes it a game instead of a form: nobody sees the guesses until
the reveal - the card only shows HOW MANY people have guessed. At the
end of the day the facilitator hits reveal, the board shows the spread,
and whoever came closest gets the glory.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - a number input calling your
API with `window.tabla.post()`, plus some way for the facilitator to
trigger the reveal. The reactions buttons show the pattern; copy it. You
are building a route that stores guesses, a reveal switch, and a card
with two faces: before (count only) and after (the spread and the
winner... once someone tells it the real answer).

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- The card must NOT leak guesses before the reveal - how do you keep the
  hidden state and the revealed state honestly separate in one card?
- Can a person change their guess before the reveal? After?
- What does the reveal show - every guess? The median? The winner needs
  the real answer to exist: where does it come from?

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
