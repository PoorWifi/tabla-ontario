#!/usr/bin/env bash
# burner-cleanup.sh - wipe everything tabla created from the current AWS
# account so the burner can be reused, then audit what (if anything) is left.
#
# Deliberately NOT aws-nuke: this deletes tabla-prefixed resources and the
# SAM-managed artifact bucket, which in a fresh burner account is everything.
# The final audit proves it. Bounded blast radius even if you run it in the
# wrong account by mistake.
#
# Usage: ./scripts/burner-cleanup.sh [region] [--yes]
set -uo pipefail

REGION="${1:-${AWS_REGION:-us-east-1}}"
YES="${2:-}"

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "############################################################"
echo "# Target account: $ACCOUNT   region: $REGION"
echo "# This deletes ALL tabla stacks, the SAM artifact bucket,"
echo "# tabla log groups, and the tabla GitHub OIDC roles/provider."
echo "############################################################"
if [ "$YES" != "--yes" ]; then
  read -r -p "Type the account id to confirm: " CONFIRM
  [ "$CONFIRM" = "$ACCOUNT" ] || { echo "Mismatch - aborting."; exit 1; }
fi

delete_stack() {
  local name="$1"
  if aws cloudformation describe-stacks --stack-name "$name" --region "$REGION" >/dev/null 2>&1; then
    echo "==> Deleting stack $name"
    aws cloudformation delete-stack --stack-name "$name" --region "$REGION"
    aws cloudformation wait stack-delete-complete --stack-name "$name" --region "$REGION" \
      || echo "WARN: $name did not delete cleanly - check the console"
  else
    echo "    stack $name not present"
  fi
}

empty_bucket() {
  local bucket="$1"
  echo "==> Emptying bucket $bucket"
  # Versioned buckets: delete every version and delete-marker first.
  local batch
  while : ; do
    batch=$(aws s3api list-object-versions --bucket "$bucket" --region "$REGION" \
      --max-items 500 \
      --query '{Objects: [Versions[].{Key:Key,VersionId:VersionId}, DeleteMarkers[].{Key:Key,VersionId:VersionId}][] | [0:500]}' \
      --output json 2>/dev/null)
    [ -z "$batch" ] && break
    echo "$batch" | grep -q '"Key"' || break
    echo "{\"Objects\": $(echo "$batch" | /usr/bin/env python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["Objects"]))'), \"Quiet\": true}" > /tmp/tabla-del.json
    aws s3api delete-objects --bucket "$bucket" --region "$REGION" --delete file:///tmp/tabla-del.json >/dev/null
  done
  rm -f /tmp/tabla-del.json
}

# 1. App stacks (tabla, tabla-*), which remove the Lambda, table, log group.
for stack in $(aws cloudformation list-stacks --region "$REGION" \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE ROLLBACK_COMPLETE CREATE_FAILED DELETE_FAILED \
    --query 'StackSummaries[?starts_with(StackName, `tabla`) && StackName != `tabla-github-oidc`].StackName' --output text); do
  delete_stack "$stack"
done

# 2. OIDC stack last (deploy role may be needed to debug a stuck app stack).
delete_stack "tabla-github-oidc"

# 3. SAM-managed artifact stack + its bucket. ORDER MATTERS (verified
# 2026-08-24): a non-empty versioned bucket makes the stack delete land in
# DELETE_FAILED, so empty the bucket FIRST, then delete the stack, then
# remove the bucket if it survived (some SAM versions set Retain).
SAM_BUCKET=$(aws cloudformation describe-stack-resources --stack-name aws-sam-cli-managed-default --region "$REGION" \
  --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text 2>/dev/null || true)
if [ -n "${SAM_BUCKET:-}" ] && [ "$SAM_BUCKET" != "None" ]; then
  empty_bucket "$SAM_BUCKET"
fi
delete_stack "aws-sam-cli-managed-default"
if [ -n "${SAM_BUCKET:-}" ] && [ "$SAM_BUCKET" != "None" ] \
   && aws s3api head-bucket --bucket "$SAM_BUCKET" --region "$REGION" 2>/dev/null; then
  aws s3api delete-bucket --bucket "$SAM_BUCKET" --region "$REGION" 2>/dev/null \
    && echo "    retained bucket deleted" || echo "    WARN: bucket survived - check console"
fi

# 4. Orphaned log groups (belt and braces - templated ones die with stacks).
for lg in $(aws logs describe-log-groups --region "$REGION" \
    --log-group-name-prefix "/aws/lambda/tabla" \
    --query 'logGroups[].logGroupName' --output text); do
  echo "==> Deleting log group $lg"
  aws logs delete-log-group --log-group-name "$lg" --region "$REGION"
done

# 5. Audit: prove the account is clean.
echo ""
echo "================= AUDIT ($ACCOUNT / $REGION) ================="
echo "--- CloudFormation stacks still standing:"
aws cloudformation list-stacks --region "$REGION" \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE DELETE_FAILED ROLLBACK_COMPLETE \
  --query 'StackSummaries[].StackName' --output text
echo "--- S3 buckets:"
aws s3api list-buckets --query 'Buckets[].Name' --output text
echo "--- DynamoDB tables:"
aws dynamodb list-tables --region "$REGION" --query 'TableNames' --output text
echo "--- Lambda functions:"
aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output text
echo "--- Log groups:"
aws logs describe-log-groups --region "$REGION" --query 'logGroups[].logGroupName' --output text
echo "--- IAM roles (tabla*):"
aws iam list-roles --query 'Roles[?starts_with(RoleName, `tabla`)].RoleName' --output text
echo "--- OIDC providers:"
aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text
echo "=============================================================="
echo "Empty sections above = clean. Anything listed needs a look."
