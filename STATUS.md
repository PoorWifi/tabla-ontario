# STATUS

Workshop repo: teams add features via agents through a KiroCrew-shaped
PR/CI workflow. Event is DAYS away - this file tracks readiness.

## Test gates

- [x] **Gate 0a** - spine + worked example, 29/29 tests, gate green (2026-08-21)
- [ ] **Gate 0b** - agent hypothesis: Kiro builds a feature from AGENTS.md +
      a 2-sentence spec, hands off keyboard. Count interventions.
- [x] **Gate 1** - DONE 2026-08-22 via live rehearsal: PRs #2-#5 ran the
      full gate/hygiene/readiness/review pipeline; four branches merged
      back to back with zero conflicts (the directory-spine claim holds);
      one-commit rule + Conventional title enforced on every PR.
- [x] **Gate 2 (manual leg)** - deployed to burner 700002441888 us-east-1
      (2026-08-22): board live, DynamoDB idempotency verified (repeat press
      `counted:false`), OIDC stack up, role vars set, Opus 5 invoke verified.
      Board: https://zpqtrr24yhqjeaw22mchvvytkm0gsjby.lambda-url.us-east-1.on.aws/
- [x] **Gate 2 (CI leg)** - DONE 2026-08-22: push to main -> deploy workflow
      green via OIDC, zero stored credentials. Two real bugs found and fixed:
      (1) new GitHub orgs issue IMMUTABLE sub claims - the token says
      `repo:org@ID/repo@ID:...`, so the trust must pin the ID form (read it
      from GET /repos/{org}/{repo}/actions/oidc/customization/sub); classic
      `org/repo` never matches and CloudTrail redacts the sub on denials.
      (2) SAM transform needs cloudformation:CreateChangeSet on
      `arn:aws:cloudformation:*:aws:transform/Serverless-2016-10-31`.
      OIDC stack parameter for THIS repo (survives burner rotation - the IDs
      are GitHub-side): `GitHubRepo=aws-hacktivity@319886780/tabla@1342396315`
- [ ] **Gate 2 (cleanup leg)** - `burner-cleanup.sh` leaves a clean audit.
      Run LAST - it deletes the live board.
- [ ] **Gate 3** - dress rehearsal with 2-3 people; stopwatch the cycle.
      Agent-cosplay leg DONE 2026-08-22 (oxide as team-05): full loop
      issue -> claim -> spec -> implement -> gate -> PR -> two AI review
      cycles -> merge -> CI deploy -> feature live -> facilitator config.
      Human leg still pending - the stopwatch number needs real people.

## AI review system (DECIDED 2026-08-22: BLOCKING, the KiroCrew way)

Shipped in PR #5, drilled live on bait PR #6:
- Two code-only lanes (Opus 5 + GPT 5.6 Terra), both BLOCKING via
  sha-pinned model verdicts: `[TABLA-REVIEWED] <head>` / `[BLOCK-MERGE]
  <head>`. Marker is the only authoritative signal; missing or mis-pinned
  verdict = "unavailable", never approval.
- `verdict-post` job aggregates lane verdicts -> posts required commit
  status `AI Verdict` (branch protection requires it + PR Readiness).
- Human override, KiroCrew semantics: comment
  `/ai-review override <opus|gpt-terra|all> <current-head-sha>: <reason>`
  - reason required <=500 chars, sha must be current head (new push voids
  the judgment), write permission required, audited judgment comment with
  hidden marker, lanes re-run and honour the marker without a model call.
  Override workflow triggers on issue_comment = runs from main = a PR
  cannot edit its own escape hatch.
- Workshop deviations from KiroCrew (deliberate): model unavailability
  fails OPEN with an explicit not-reviewed comment (they fail closed);
  repo var `REVIEW_BLOCKING=false` is the mid-event kill switch.
- Bait drill evidence (PR #6): gate-green spine violation -> both lanes
  BLOCK-MERGE -> AI Verdict fail -> override -> AI Verdict success ->
  closed unmerged.

## Rehearsal findings (2026-08-22, thirteen)

1. Backlog was empty - a real team stalls at minute one. Issue #1 seeded;
   11 remain.
2. Opus 5 rejects `temperature` (ValidationException) - removed.
3. Opus responses lead with reasoning blocks - `content[0].text` reads
   null; select text blocks wherever they sit.
4. `[ -s file ]` is fooled by jq's trailing newline - grep for
   non-whitespace instead.
5. maxTokens 1500 eaten by reasoning -> empty review; 4000 works.
6. `pull_request` workflows run from the MERGE REF - a PR can edit the
   reviewer that judges it. Prompt is base-pinned already; scoped
   CODEOWNERS on `.github/**` still needed (open).
7. Reviewer disagreement is real and useful: Terra enforces boundary
   rules strictly; Opus finds control-flow holes (it caught the dead-call
   path that impersonated a clean review).
8. AI findings must be verified empirically: Opus's GITHUB_ENV claim was
   half-wrong (env DOES gate later steps) but the restructure it wanted
   was still right. Challenge, verify, then act - the workshop thesis.
9. `gh run rerun` reuses the ORIGINAL run's workflow version and merge
   commit - it can never pick up fixes merged to main afterwards. Rebase
   + force-push to get a fresh run.
10. Both lanes independently BLOCK CI-machinery changes per rule 1 -
    correct behaviour, resolved by facilitator override (or future
    CODEOWNERS).
11. Deploy role trust: GitHub environment jobs send the ENVIRONMENT sub
    claim, not the branch ref (see Gate 2 notes).
12. New-org immutable OIDC sub claims (see Gate 2 notes) - the big one.
13. The board page must speak product, not scaffold - "1 feature(s)
    mounted, drop a directory" reads as workshop tooling and confused
    even the facilitator. Product-voice pass shipped.

## Reusing this repo for future workshops (TEMPLATE, verified 2026-08-23)

**The template itself must NOT deploy.** Its `AWS_DEPLOY_ROLE_ARN`
variable is deliberately unset (removed 2026-08-24 after a template push
clobbered the rehearsal board - both repos deployed the same `tabla`
stack). Event repos set their own role variables via the setup runbook;
the template's Deploy job skips cleanly without one. Do not "fix" this
by re-adding the variable.

This repo is a GitHub template (`is_template: true`). Per event:

1. Generate: `gh repo create aws-hacktivity/tabla-<event> --template aws-hacktivity/tabla --private --clone`
   Fresh copy = clean history, no old issues/PRs/collaborators.
2. `cd tabla-<event> && ./scripts/workshop-setup.sh` - recreates everything
   template generation drops (API-side state): squash-only settings, the
   12-label set, all backlog issues seeded from `backlog/*.md`, the
   production environment, stable Actions variables, branch protection
   (PR Readiness + AI Verdict + code owners). Idempotent. Finishes by
   printing the OIDC runbook with the NEW repo's immutable IDs read live
   from the customization/sub endpoint.
3. Follow the printed steps: vend burner, deploy OIDC stack, set role ARN
   variables, `./scripts/deploy.sh <region> "<Event Title>"`, invite
   drivers (after OIDC, not before).

Verified end to end 2026-08-23 against scratch repo tabla-setup-test
(archived): 11 issues seeded, protection + env + vars correct, re-run
produced zero duplicates, and the printed OIDC parameter carried the
test repo's own ID - per-repo pinning works automatically.

## Burner account bring-up (each fresh burner)

1. `aws login` (or export creds), then:
   `aws cloudformation deploy --stack-name tabla-github-oidc --template-file infra/github-oidc.yaml --capabilities CAPABILITY_NAMED_IAM --parameter-overrides "GitHubRepo=aws-hacktivity@319886780/tabla@1342396315" --region us-east-1`
   (ID-pinned form is REQUIRED - see Gate 2 CI leg; `org/repo` never matches.)
2. Repo variables (Settings -> Secrets and variables -> Actions -> Variables):
   `AWS_DEPLOY_ROLE_ARN`, `AWS_REVIEW_ROLE_ARN` (from stack outputs),
   `AWS_REGION` (us-east-1), optional `BEDROCK_REVIEW_MODEL`.
3. Bedrock: reviewer model is set (repo var `BEDROCK_REVIEW_MODEL` =
   `us.anthropic.claude-opus-5`, done 2026-08-22). Profile ID not ARN on
   purpose: system-defined `us.` profiles have the same ID in every account,
   so it survives burner rotation. Verify in each fresh burner:
   `aws bedrock list-inference-profiles --region us-east-1 --query 'inferenceProfileSummaries[?inferenceProfileId==`us.anthropic.claude-opus-5`].status'`
4. First deploy: `./scripts/deploy.sh us-east-1` (manual, proves template).
   After that, merges to main deploy automatically.
5. Reuse: `./scripts/burner-cleanup.sh us-east-1`, check audit says clean.

## Open items

- [x] qr-code proved the pipeline end to end via real PR (#2, full review
      cycle) then was REVERTED 2026-08-23 to restore the vanilla shelf for
      the event - issue #1 reopened, PR #2 stays as the reference run.
      Teams copy `features/reactions/`; profanity-filter pre-merge remains
      optional.
- [ ] Seeded backlog as GitHub issues (issue #1 done; 11 features remain,
      one `area:` label each).
- [x] Scoped CODEOWNERS on `.github/**` (facilitator approval required) -
      closes rehearsal finding 6/10 properly.
- [ ] Per-lane sticky review comments (update-in-place) - post-event
      polish; append-only is fine for one afternoon.
- [ ] Kiro Free plan limits under workshop load - verify before the event.
- [x] Repo transferred to org `aws-hacktivity` (2026-08-22): variables
      survived, squash-only survived, local remote repointed.
- [x] Branch protection ON: require `PR Readiness` + 1 approving review,
      linear history, no force pushes. Admins exempt (facilitator bypass).
- [x] OIDC rewired to org repo (see Gate 2 CI leg above for the ID-pinned
      parameter and the two gotchas).
- [ ] Org seats: outside collaborators on a private repo consume paid
      seats ($4/user/mo) - budget ~13 seats for event month, downgrade
      org to Free after.
- [ ] GO PUBLIC BEFORE THE WORKSHOP (decision 2026-08-22). Ordered
      checklist, because the flip is one-way for the corp laptop:
      1. Scrub burner account id + board URL from this file first.
      2. Push ALL pending local commits - after the flip the corp laptop
         CANNOT push to the (public) repo at all; merges happen via web
         UI / gh, new commits need a non-corp machine.
      3. Flip visibility in the web UI (Settings -> Danger Zone).
      4. Fork posture stays enforced: fork-notice workflow fails fork PRs
         fast with instructions (public repos cannot disable forking).
      5. Team plan note: public-repo collaborators do not consume paid
         seats the way private-repo ones do - recheck the seat budget.
- [x] Scoped CODEOWNERS (2026-08-22): `.github/` + `src/spine/` require
      facilitator approval (require_code_owner_reviews ON in protection);
      feature dirs stay unowned so cross-team review satisfies them.
- [x] Fork-notice workflow (2026-08-22): pull_request_target, checkout-free
      by design, posts failing AI Verdict + instruction comment on fork
      PRs so they fail fast instead of hanging on a missing status.
- [x] Decide advisory vs blocking: BLOCKING, shipped PR #5, drilled PR #6
      (see "AI review system" section).
- [ ] GSI1 (recent feed) - add only when a feature needs it.

## Architecture decisions

- Attendees never hold AWS credentials; CI deploys via GitHub OIDC.
- Lambda Function URL (AuthType NONE - public room board, by design).
- Build-time feature manifest for Lambda (`npm run gen`, gitignored);
  runtime discovery stays for local dev. Parity enforced by test.
- AI reviewers: Bedrock via OIDC (no API-key secrets), prompt pinned to PR
  base commit, code-only input, 2-finding budget, BLOCKING with sha-pinned
  verdicts + human override + kill switch (see AI review system section).
- Cleanup: targeted teardown + audit, not aws-nuke.
