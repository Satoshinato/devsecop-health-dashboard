#!/usr/bin/env bash
# Sync Next static export to the web bucket. Gated by the pipeline publishWeb flag.
set -euo pipefail
: "${DASHBOARD_WEB_BUCKET:?DASHBOARD_WEB_BUCKET is required}"
: "${WEB_DIR:?WEB_DIR is required}"
test -d "$WEB_DIR"

aws s3 sync "$WEB_DIR" "s3://$DASHBOARD_WEB_BUCKET/" \
  --delete \
  --cache-control "public,max-age=60" \
  --exclude "data/*"

if [ -d "$WEB_DIR/data" ]; then
  aws s3 sync "$WEB_DIR/data" "s3://$DASHBOARD_WEB_BUCKET/data/" \
    --cache-control "no-cache" \
    --content-type application/json
fi

if [ -n "${CLOUDFRONT_DISTRIBUTION:-}" ]; then
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
    --paths "/*"
fi
