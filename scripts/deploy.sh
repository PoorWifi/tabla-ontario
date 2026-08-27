#!/usr/bin/env bash
# Deploy tabla to the current AWS account. Usage: ./scripts/deploy.sh [region]
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${1:-${AWS_REGION:-us-east-1}}"
TITLE="${2:-}"
command -v sam >/dev/null || { echo "sam cli missing: brew install aws-sam-cli"; exit 1; }

echo "==> Deploying to account $(aws sts get-caller-identity --query Account --output text) in $REGION"

npm run build

EXTRA=()
# SAM's shorthand needs embedded quotes when the value contains spaces:
# --parameter-overrides 'SessionTitle="My Event Title"'
[ -n "$TITLE" ] && EXTRA=(--parameter-overrides "SessionTitle=\"$TITLE\"")

sam deploy \
  --stack-name tabla \
  --region "$REGION" \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_IAM \
  ${EXTRA[@]+"${EXTRA[@]}"}

URL=$(aws cloudformation describe-stacks --stack-name tabla --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`BoardUrl`].OutputValue' --output text)

echo ""
echo "==> Board is live: $URL"
echo "    Smoke test:"
echo "    curl -s -X POST ${URL}api/reactions -H 'content-type: application/json' -d '{\"session\":\"workshop\",\"emoji\":\"🔥\"}'"
