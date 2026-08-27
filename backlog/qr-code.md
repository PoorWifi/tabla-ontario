# Board: scan-to-join (qr-code)

Someone walks in fifteen minutes late. The board is on the projector,
full of live activity, and they want in. Nobody wants to read a
40-character Lambda URL off a screen and type it on a phone. They point
their camera at a QR code in the corner of the board, tap, and they are
on. That QR code is your feature.

**How input works here - and this one is different:** most features take
input from the whole room through their card. Yours takes ONE piece of
input, once, from the facilitator: the board's own public URL, so your
card can render it as a QR code. There is no text box for the room -
your card just shows the code (or a setup hint until the URL is set).
The facilitator can send that one configuration request with `curl` or
anything else that can POST.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Where does the board's own public URL come from? (Nothing in the
  runtime hands it to you - check the Architecture section and decide:
  config in the store? Something else?)
- Who is allowed to set or change it, given that tabla has no auth by
  design? What is the honest answer, and what do you write in the README
  about it?
- What does the card show before anyone has configured it?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
