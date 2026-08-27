#!/usr/bin/env bash
# workshop-setup.sh - one-time setup for a repo generated from the tabla
# template. Template generation copies FILES ONLY; this script recreates
# everything that lives in GitHub's API instead of in the tree:
#
#   repo settings (squash-only, no forking), labels + backlog issues
#   (from backlog/*.md), the production environment, Actions variables,
#   and branch protection (PR Readiness + AI Verdict + code owners).
#
# It finishes by printing the burner-account OIDC runbook with THIS repo's
# immutable IDs (each generated repo has new IDs - an org/repo-shaped
# trust never matches; see STATUS.md, Gate 2 findings).
#
# Usage: run from the fresh clone's root:  ./scripts/workshop-setup.sh
# Idempotent: safe to re-run.
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
REGION="${AWS_REGION:-us-east-1}"
echo "==> Setting up $REPO (region default: $REGION)"

echo "==> Repo settings: squash-only, delete-branch-on-merge"
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false \
  -F allow_rebase_merge=false -F delete_branch_on_merge=true >/dev/null
# Best effort: rejected with 422 when org policy already forbids private
# forking (which IS the desired state), and unavailable on public repos.
gh api -X PATCH "repos/$REPO" -F allow_forking=false >/dev/null 2>&1 \
  && echo "    forking disabled" \
  || echo "    forking left to org/visibility policy (fork-notice workflow covers public)"

echo "==> Labels + backlog issues from backlog/*.md"
existing_titles=$(gh issue list --repo "$REPO" --state all --limit 100 --json title --jq '.[].title')
for f in backlog/*.md; do
  slug=$(basename "$f" .md)
  title=$(head -1 "$f" | sed 's/^# *//')
  label="area: features/$slug"
  gh label create "$label" --repo "$REPO" --color FFB100 2>/dev/null || true
  if printf '%s\n' "$existing_titles" | grep -qxF "$title"; then
    echo "    exists: $title"
  else
    tail -n +2 "$f" > /tmp/tabla-issue-body.md
    gh issue create --repo "$REPO" --title "$title" \
      --label "$label" --body-file /tmp/tabla-issue-body.md >/dev/null
    echo "    seeded: $title"
  fi
done
rm -f /tmp/tabla-issue-body.md

echo "==> Production environment locked to protected branches"
gh api -X PUT "repos/$REPO/environments/production" \
  -F "deployment_branch_policy[protected_branches]=true" \
  -F "deployment_branch_policy[custom_branch_policies]=false" >/dev/null

echo "==> Actions variables (stable ones; role ARNs come after the OIDC stack)"
set_var() {
  gh api -X POST "repos/$REPO/actions/variables" -f name="$1" -f value="$2" 2>/dev/null \
    || gh api -X PATCH "repos/$REPO/actions/variables/$1" -f name="$1" -f value="$2" >/dev/null
}
set_var AWS_REGION "$REGION"
set_var BEDROCK_REVIEW_MODEL "us.anthropic.claude-opus-5"
set_var BEDROCK_REVIEW_MODEL_2 "us.openai.gpt-5.6-terra"

echo "==> Branch protection on main"
cat > /tmp/tabla-protection.json <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["PR Readiness", "AI Verdict"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
gh api -X PUT "repos/$REPO/branches/main/protection" \
  --input /tmp/tabla-protection.json >/dev/null
rm -f /tmp/tabla-protection.json

echo "==> Reading THIS repo's immutable OIDC subject prefix"
sub_prefix=$(gh api "repos/$REPO/actions/oidc/customization/sub" --jq '.sub_claim_prefix' 2>/dev/null || true)
if [ -n "$sub_prefix" ]; then
  oidc_repo="${sub_prefix#repo:}"
else
  oidc_repo="$REPO   # (could not read customization/sub - verify manually!)"
fi

cat <<DONE

============================================================
GitHub side: DONE. Remaining (needs burner-account creds):

1. aws login (burner profile), then deploy the OIDC stack with
   THIS repo's ID-pinned path:

   aws cloudformation deploy --stack-name tabla-github-oidc \\
     --template-file infra/github-oidc.yaml \\
     --capabilities CAPABILITY_NAMED_IAM \\
     --parameter-overrides "GitHubRepo=$oidc_repo" \\
     --region $REGION

2. Copy the two role ARNs from the stack outputs into repo variables:

   gh api -X POST repos/$REPO/actions/variables -f name=AWS_DEPLOY_ROLE_ARN -f value=<DeployRoleArn>
   gh api -X POST repos/$REPO/actions/variables -f name=AWS_REVIEW_ROLE_ARN -f value=<ReviewRoleArn>

3. First deploy (prints the board URL for the projector):

   ./scripts/deploy.sh $REGION "<Event Title>"

4. Invite driver laptops as collaborators. Do OIDC (steps 1-2)
   BEFORE inviting teams - review lanes need the role.

Reset the burner between events: ./scripts/burner-cleanup.sh $REGION
============================================================
DONE
