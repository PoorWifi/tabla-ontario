# Board: break countdown (countdown-timer)

"Back in ten minutes!" - and then half the room drifts back at minute
fourteen because nobody knows when ten minutes started. Your feature puts
the answer on the board: "Break - back at 14:05 (3 min left)". The
facilitator sets it once, the whole room sees the same clock, and when
time is up the card says so.

**How input works here - the config shape:** most features take input
from the whole room through their card. Yours takes ONE piece of input
from the facilitator: when the break ends. A curl POST is fine - decide
what it carries (an end time? a duration?). Your card renders the
countdown for everyone. One wrinkle worth knowing before you design: the
board re-renders cards every few seconds on the server, so your card
recomputes "minutes left" each render - it does not tick every second,
and that is fine for a break timer.

**Your spec must answer** (there is no handed-down right answer, but your
README has to pick one and your code has to match it):

- Duration or end time in the request - and what happens with a nonsense
  value (negative, absurdly long, not a number)?
- What does the card show before any timer is set, while it runs, and
  after it expires?
- Setting a new timer while one runs: replace, reject, or something else?

Read the Architecture section of the README before deciding where your
data lives and which store verb carries your semantics.

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
