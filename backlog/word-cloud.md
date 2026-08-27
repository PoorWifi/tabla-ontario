# Board: one-word check-in (word-cloud)

Picture this room in an hour. The facilitator asks: "describe this
session in ONE word." Everyone types a word on their phone and hits
submit. The board - on the projector and on every phone - draws all the
words at once: the more people picked a word, the bigger it renders.
Seven people typed "fun"? Huge. One person typed "confusing"? Small, but
the facilitator sees it and slows down. That is a word cloud, and the
words come from the room, through your feature.

**How input works here:** the board page renders each feature's card, and
a card is just HTML your feature returns - it can contain a text input
and a submit button that call your API with `window.tabla.post()`. The
reactions feature's emoji buttons work exactly this way; copy that
pattern. So you are building three things: an API route that stores each
person's word, a card that both collects words (the input) and draws them
(the cloud, font-sized by count), and the rules for what counts as a
word.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Can a person change their word? What happens to the old one?
- What counts as ONE word? "very good"? An emoji? 40 characters of z?
- The board renders whatever people type, on a very large projector. What
  could go wrong with that, and where do you stop it?

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
