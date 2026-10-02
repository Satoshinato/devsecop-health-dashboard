#!/usr/bin/env bash
# Publish dashboard.json + history.json to s3://accusys-devsecops/data/
# Pulls previous history from S3 when present. No CloudFront.
set -euo pipefail
: "${DASHBOARD_BUCKET:?DASHBOARD_BUCKET is required}"
: "${REPORT_DIR:?REPORT_DIR is required}"

report="$REPORT_DIR"
test -s "$report/dashboard.json"
previous="$report/previous-history.json"

if aws s3api head-object \
  --bucket "$DASHBOARD_BUCKET" \
  --key "data/history.json" >/dev/null 2>&1; then
  aws s3 cp "s3://$DASHBOARD_BUCKET/data/history.json" "$previous"
  npx tsx collector/main.ts \
    --merge \
    --azure-file "$report/dashboard.json" \
    --history-file "$previous" \
    --out "$report"
fi

test -s "$report/history.json"

scan_date=`node -p "require('$report/dashboard.json').fecha"`

aws s3 cp "$report/dashboard.json" \
  "s3://$DASHBOARD_BUCKET/data/dashboard.json" \
  --content-type application/json --cache-control "no-cache"
aws s3 cp "$report/history.json" \
  "s3://$DASHBOARD_BUCKET/data/history.json" \
  --content-type application/json --cache-control "no-cache"
aws s3 cp "$report/dashboard.json" \
  "s3://$DASHBOARD_BUCKET/runs/$scan_date/dashboard.json" \
  --content-type application/json --cache-control "public,max-age=31536000,immutable"
