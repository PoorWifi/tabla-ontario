# Board: profanity filter (profanity-filter)

Free-text features keep landing on this board, and the projector is very
large. The room needs a way to keep text presentable.

**Your spec must answer:**

- Filter, mask, or reject - and at what moment: when text arrives, or
  when it renders?
- Word-boundary thinking: "class" contains a word some lists dislike.
  How do you avoid the false positives without missing the real hits?
- Is this a shared helper other features call, or a route of its own?
  What does your choice cost the teams that come after you?

**Boundaries:** one directory under `features/`, spec in your README
before code, `npm run gate` green, one commit.
