# AGENTS.md

This file is a ROUTER, not a manual. It carries only the rules whose
violation causes damage before a pointer could be read.

## The four rules

1. **Never edit anything under `src/spine/`.** Your feature is a directory
   under `features/`. If you think you need a spine change, you are holding
   the contract wrong - re-read `src/spine/types.ts`.
2. **Run the gate before you push.** Copy-paste:
   ```sh
   npm run gate
   ```
   Green gate locally means green CI. A broken feature cannot merge: the
   `GATE:` test in `src/spine/discovery.test.ts` loads every feature and
   fails on the first malformed one, naming the directory.
3. **One feature, one directory, one PR.** Your diff touches
   `features/<your-name>/` and nothing else. `name` in `feature.ts` must
   equal the directory name.
4. **Store keys follow the convention** `pk = SESSION#<sessionId>`,
   `sk = <TYPE>#<discriminator>`. Put your caller id IN the sort key when
   you need per-person idempotency, and use `putIfAbsent` - see the worked
   example.

## Read before you touch

| If you are touching…                  | Read first                              |
| ------------------------------------- | --------------------------------------- |
| A new feature (routes, store, card)    | `src/spine/types.ts` - the whole contract |
| Anything store-related                 | `features/reactions/README.md` - key convention worked through |
| A board card for the projector         | `features/reactions/feature.ts` - `card` at the bottom |
| Tests for your feature                 | `features/reactions/feature.test.ts` - drive routes through `Router`, never call handlers bare |
| Opening or updating a PR               | `.kiro/skills/tabla-prepare-pr/SKILL.md` - the single source of truth for the PR workflow; agents load it automatically |
| Your feature's spec                    | `features/reactions/README.md` - EARS-style requirements shape to copy |
| Deployment or CI (maintainers)         | `template.yaml`, `.github/workflows/` - features never need changes here |
| The AI reviewers                       | `.github/REVIEW_RULES.yaml` + `.github/review-prompts/reviewer-{opus,terra}.md` - rules are data, loaded from the BASE commit so your PR cannot edit what judges it. Opus reviews code only; Terra also checks your PR description's claims against the diff |

## Gates you will trip

| Gate | What it means | Fix |
| ---- | ------------- | --- |
| `TS1294 erasableSyntaxOnly` | You used TS syntax Node cannot strip (parameter properties, enums, namespaces) | Plain fields and unions; this repo runs TypeScript natively via Node type stripping |
| `GATE: every feature in features/ loads` | Your `feature.ts` is malformed | The assertion message names your directory and the exact problem |
| `"name" must equal the directory name` | Renamed the dir but not the export (or vice versa) | Make them match |

## How to add a feature

```sh
cp -r features/_template features/<your-name>
# edit feature.ts: set name (= directory), description, routes
npm run gate          # must be green
npm run dev           # http://localhost:3000 - your card is on the board
```
