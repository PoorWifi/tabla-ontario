# <your-feature-name>

One sentence: what does this feature do for the room?

## Requirements (EARS style)

Write these BEFORE you point your agent at the code. The spec is your
team's deliverable; the agent writes the code.

- WHEN <trigger>, THE SYSTEM SHALL <observable behaviour>.
- WHEN <bad input>, THE SYSTEM SHALL <reject how> and record nothing.

## Store keys

| pk                  | sk                     | item    |
| ------------------- | ---------------------- | ------- |
| `SESSION#<session>` | `<TYPE>#<discriminator>` | `{...}` |
