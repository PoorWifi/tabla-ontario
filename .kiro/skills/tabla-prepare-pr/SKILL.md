---
name: tabla-prepare-pr
description: Drives a tabla feature from working tree to merged, the repo way - gate green, exactly one commit, branch PR (never a fork), then respond to the two blocking AI review lanes until the AI Verdict status is green and a cross-team human approves. Load this whenever a task will open or update a PR in this repo, including PRs raised incidentally while building a feature. Trigger phrasings include "open a PR", "prepare the PR", "ship this feature", "get it merged", "handle the review", "fix the review findings", "make it green".
---

# tabla: prepare a PR

## The finish line

Review-ready means: exactly ONE commit on a feature branch, `npm run gate`
green, PR open with every claim in the body supported by the diff, the
`PR Readiness` and `AI Verdict` statuses green, every reviewer finding
answered, and one approving review from another team. Then the DRIVER
merges (squash) from the UI. You never merge.

## Hard rules (violating these wastes the room's time)

1. Your diff touches `features/<your-name>/` ONLY. `src/spine/` and
   `.github/` are facilitator territory - CODEOWNERS will hold the PR and
   both AI lanes will BLOCK-MERGE it.
2. Never push to `main`. Feature branch, `git push -u origin <branch>`.
3. Exactly one commit, Conventional Commits title (it becomes the squash
   message): `feat(<feature>): <what>`. To collapse work-in-progress:
   `git reset --soft origin/main && git commit`.
4. Spec before code: `features/<name>/README.md` (EARS requirements +
   store keys). The PR body links it.

## The loop

1. **Gate locally first**: `npm run gate` until green. Green locally means
   green CI - pushing red wastes a round trip.
2. **Push + open the PR** using the template. Fill "What changed" with the
   causal shape (what the feature does, how the change achieves it) and
   "How it was verified" with the real gate output and what you clicked on
   the local board (`npm run dev`).
3. **Wait for checks** (~1-2 min): gate, pr-hygiene, PR Readiness, two AI
   review lanes (opus + gpt-terra), AI Verdict.
4. **Answer every finding** - this is mandatory, silence reads as "the
   author never looked":
   - A **BLOCKING** finding flips AI Verdict red. Fix it, or dispute it.
   - To FIX: change the code, re-run the gate, amend the single commit
     (`git commit --amend --no-edit`), then
     `git push --force-with-lease origin <branch>`. The push re-runs the
     lanes automatically.
   - To DISPUTE: verify the claim against the actual code first - run the
     code path, read the docs, test it. Reviewers are sometimes confidently
     half-wrong. Reply on the PR with your evidence (code path, test
     output), not vibes. If the reviewer holds its BLOCK on re-run and you
     still believe it is wrong, escalate to the facilitator - the
     `/ai-review override` command is theirs, not yours.
   - A **SUGGESTION** never blocks. Fix it if it is cheap and right,
     otherwise reply with one sentence of reasoning. Do not widen the diff
     to satisfy advisory feedback.
5. **Bounded loop**: if you are not green after 4 fix rounds, stop and get
   the facilitator - something structural is wrong.
6. **Cross-team review**: ask the team assigned to review you (round-robin,
   team N reviews team N+1). Address their comments the same way: fix or
   reply, never ignore.
7. **After the driver merges**: the deploy workflow ships main to AWS
   automatically. Verify your feature on the live board (~2 min). That
   projector moment is the point of all of this.

## Gotchas that will bite you

- Re-running a failed check re-uses the OLD workflow and merge commit. If
  a fix landed on main after your PR opened, rebase onto fresh main and
  force-push - that is what picks it up.
- The AI lanes read the review prompt from the BASE commit: your PR cannot
  change the rules it is judged by. Do not try.
- The board page provides `window.tabla.post()` and `tabla.session` to
  card HTML - copy the reactions feature for interactive cards; never edit
  the spine to add client behaviour.
- Tests drive routes through `Router.dispatch`, never bare handler calls -
  copy `features/reactions/feature.test.ts` for the shape.
- Force-push ONLY your own feature branch, only with `--force-with-lease`,
  and never `main`.
