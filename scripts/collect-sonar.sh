#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="${OUT_DIR:-public/data}"
mkdir -p "$OUT_DIR"
npx tsx collector/main.ts --source=sonar --out "$OUT_DIR"
test -s "$OUT_DIR/dashboard.json"
