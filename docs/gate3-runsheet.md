# Gate 3 run-sheet: the human dress rehearsal

One fake team, real humans, full loop, stopwatch. The goal is a NUMBER
(minutes per feature cycle), not a demo. The friction IS the data - do not
rescue the team unless a phase stalls past its cap.

## Cast

- **Team**: 2-3 colleagues, ONE driver laptop (mob style).
- **Facilitator**: you. Also plays the reviewing team.

## Before the clock starts

- Rehearsal repo live (issues seeded, board deployed, OIDC wired).
- Driver invited as collaborator; invite ACCEPTED.
- Send the driver the setup ask: git + node 22.18+ + Kiro installed and
  signed in. Whether this actually happened is phase 1's measurement.

## The five phases (stopwatch each)

| # | Phase | Done when | Cap | Reference* |
|---|-------|-----------|-----|-----------|
| 1 | Setup | `npm run dev` shows the board on the driver's localhost | 15 min | - |
| 2 | Claim + spec | Issue claimed with a comment; `features/<name>/README.md` written by the TEAM | 20 min HARD | - |
| 3 | Agent loop | `npm run gate` green, feature works on the local board | 30 min | ~10 min |
| 4 | PR + AI reviews | PR open, lanes settled (fix or dispute each finding) | 3 fix rounds | 2 rounds |
| 5 | Human review -> board | Facilitator approves, driver merges, feature visible on the LIVE board | 10 min | ~4 min |

*Reference = the agent-only drill of 2026-08-24 (word-cloud). Humans will
be slower at 2 and 3 - that gap is exactly what you are measuring.

## The canonical driver prompt (copy-paste, then hands off keyboard)

    Read AGENTS.md. Implement features/<name> per its README.
    Run npm run gate until green.

## Facilitator observation sheet

- [ ] Did Kiro load `tabla-prepare-pr` unprompted at PR time? (Gate 0 folded in)
- [ ] Interventions: how many times did a human touch code or re-prompt?
- [ ] Did the diff stay inside `features/<name>/`?
- [ ] Gate failures before push: ___  · CI rounds: ___
- [ ] Review findings: real ___ / false ___ / disputed ___
- [ ] Override needed? Who decided, how long did the call take?
- [ ] Friction log (auth, wifi, confusion - verbatim quotes are gold):

## Timing record

| Phase | Start | End | Minutes | Notes |
|-------|-------|-----|---------|-------|
| 1 Setup | | | | |
| 2 Spec | | | | |
| 3 Agent | | | | |
| 4 Reviews | | | | |
| 5 Merge->board | | | | |

**Schedule math**: cycle = phases 2+3+4+5. Event capacity per team =
floor(build-block minutes / cycle). If cycle > 55 min, cut the event's
spec phase to fill-in-the-template instead of write-from-scratch.

## Escape hatches (use loudly, note the time cost)

- Disputed AI finding held on re-run: `/ai-review override <lane> <head-sha>: <reason>`
- Review lanes wedged (model outage): set repo variable `REVIEW_BLOCKING=false`
- Team hard-stuck: facilitator admin-merge - and write down WHY, that is a
  finding about the event, not about the team

## Facilitator restraint rules

Answer questions about WHAT (the product, the spec). Do not answer HOW
(the commands, the workflow) - AGENTS.md and the skill must carry that, or
the event will not scale past one table. Every time you break this rule,
tally it: each tally is a docs gap to fix before the event.
