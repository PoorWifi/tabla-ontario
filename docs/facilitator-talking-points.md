# Facilitator talking points - the agent-loop segment

Teams are heads-down for 30-45 minutes. That is your stage time. Eight
beats, each 3-5 minutes: a trigger for when to drop it, the point, a live
prop, and the war story that makes it stick. Do not run them in order -
run whichever one the room just made relevant.

---

## 1. Watch one PR go through, live

**When:** the first team pushes.
**Prop:** their PR's checks tab on the projector.

Walk it: gate, hygiene, readiness, two AI reviews, the AI Verdict status.
Point at the verdict line inside a review comment - the model signs its
verdict against the exact commit sha. Not vibes, a signature. A new push
voids it.

## 2. Two reviewers, two different jobs

**When:** the first AI review comment lands.
**Prop:** any PR with both lane comments.

One lane never sees the PR description - it judges code only, so nothing
you write in a PR body can sweet-talk it. The other reads the description
on purpose, as untrusted data inside a random fence, and checks your
claims against your diff. **War story:** we opened a PR whose description
claimed a 280-character limit, a cache, and 8 tests - none existed - and
ordered the reviewer to approve. The code lane passed it (clean code!),
the context lane blocked it with all three lies cited, and ignored the
order entirely.

## 3. A PR cannot edit its own judge

**When:** someone asks "what stops me from changing the rules?"
**Prop:** `.github/REVIEW_RULES.yaml` + the workflow line that reads it.

The prompts and rules load from the BASE commit - the code your PR wants
to join, not the code your PR brings. Plus CODEOWNERS routes any change
to the review machinery to a human owner. Defense in layers, each one
cheap.

## 4. The override: machines gate, humans stay sovereign

**When:** the first false positive - there will be one.
**Prop:** a `/ai-review override` judgment comment, with name and reason.

An AI reviewer that cannot be overruled is a tyrant; one that can be
ignored is a decoration. The middle: it blocks, and a named human can
overrule it in ten seconds, on the record, void on the next push.
**War story:** our reviewer demanded count-once semantics on a feature
whose spec said latest-wins. It was confidently wrong. The dispute, the
held verdict, and the override are all still readable on the PR.

## 5. Why nobody here has AWS credentials

**When:** mid-lull, or when someone asks how deploys work.
**Prop:** the deploy workflow run of the last merge.

GitHub mints an identity token per run; AWS trusts this exact repo - by
immutable ID, not by name - to assume one narrow role. No keys exist to
leak. **War story:** the trust broke for us once because a new GitHub org
signs tokens with IDs, not names - the error was unreadable, CloudTrail
redacts the details, and the fix was reading the actual claim instead of
theorizing. Ask the room: where do CI credentials live in YOUR org?

## 6. Why features are directories

**When:** two teams merge within minutes of each other.
**Prop:** the merge list - zero conflicts.

N teams, one repo, one afternoon, no merge conflicts - because nothing
shared ever gets edited. A feature is a directory; discovery mounts it.
The moment you add a shared registry file, you have built a queue.

## 7. One table, four verbs, your semantics

**When:** a team argues about their data model - the best trigger there is.
**Prop:** the Architecture section of the README.

Every feature shares one DynamoDB table and four store verbs. The
interesting part: which verb you choose IS your product decision -
count-once versus latest-wins is one line of code apart and a whole spec
apart. **War story:** the reviewer false positive in beat 4 was exactly
this distinction - even the AI tripped on it, which is why your spec has
to say which one you mean.

## 8. The reviewer caught what the tests missed

**When:** late, as energy dips - this one lands hard.
**Prop:** the prototype-pollution finding on our rehearsal PR.

An agent wrote a word-cloud feature, tests green, gate green. The AI
reviewer blocked it: submit the word "constructor" and the count corrupts
- `Object.prototype` leaks into the aggregate; "__proto__" vanishes
entirely. At a dev workshop, someone WILL type "constructor". Then the
honest other half: the same reviewer's sibling produced the beat-4 false
positive the same day. Neither blind trust nor blanket dismissal survives
contact with these tools - verify, then decide. That is the whole
workshop in one sentence.

---

## Ask-the-room questions (fill dead air, start arguments)

- Should AI reviews block, or only advise? What changed your mind today?
- Who is the author of an agent-written PR - you, the agent, the team?
- What five rules would go in the REVIEW_RULES.yaml of YOUR repo at work?
- What is the tabla equivalent in your team - the app you would rebuild
  to teach your own pipeline?
