# reactions

React to the current session with an emoji. One reaction per person per
emoji - pressing 🔥 twice counts once.

## Requirements (EARS style)

- WHEN a caller POSTs `/api/reactions` with `{session, emoji}` and the emoji
  is one of 👍 🔥 🤯 ❓ 🐢, THE SYSTEM SHALL record at most one reaction per
  caller per emoji and respond 201 (first time) or 200 (repeat).
- WHEN a caller POSTs an emoji outside the allowed set, THE SYSTEM SHALL
  respond 400 and record nothing.
- WHEN a caller GETs `/api/reactions?session=<id>`, THE SYSTEM SHALL return
  the count per allowed emoji.

## Store keys

| pk                   | sk                              | item          |
| -------------------- | ------------------------------- | ------------- |
| `SESSION#<session>`  | `REACTION#<emoji>#<callerId>`   | `{emoji, at}` |

Idempotency comes from `putIfAbsent` on that sk - the caller id is in the
key, so a repeat press cannot create a second item.
