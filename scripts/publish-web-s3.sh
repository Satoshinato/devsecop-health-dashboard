#!/usr/bin/env bash
# Sync Next static export to the same bucket (accusys-devsecops).
# Does not touch data/ or runs/ — those keys belong to publish-data-s3.sh.
set -euo pipefail
: "${DASHBOARD_BUCKET:?DASHBOARD_BUCKET is required}"
: "${WEB_DIR:?WEB_DIR is required}"
test -d "$WEB_DIR"

aws s3 sync "$WEB_DIR" "s3://$DASHBOARD_BUCKET/" \
  --delete \
  --cache-control "public,max-age=60" \
  --exclude "data/*" \
  --exclude "data/*/*" \
  --exclude "runs/*" \
  --exclude "runs/*/*"
