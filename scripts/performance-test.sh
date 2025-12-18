#!/bin/sh
# Basic performance smoke test for AccrediFy endpoints.
#
# Defaults to the public health endpoint (no auth required).
#
# Usage:
#   ./scripts/performance-test.sh
#
# Env overrides:
#   TARGET_URL=http://localhost:8000/api/health/
#   DURATION=15s
#   CONNECTIONS=20
#   THREADS=2

set -eu

TARGET_URL="${TARGET_URL:-http://localhost:8000/api/health/}"
DURATION="${DURATION:-15s}"
CONNECTIONS="${CONNECTIONS:-20}"
THREADS="${THREADS:-2}"

echo "[INFO] Target: ${TARGET_URL}"
echo "[INFO] Duration: ${DURATION}  Connections: ${CONNECTIONS}  Threads: ${THREADS}"

if command -v wrk >/dev/null 2>&1; then
  echo "[INFO] Using wrk"
  wrk -t"${THREADS}" -c"${CONNECTIONS}" -d"${DURATION}" "${TARGET_URL}"
  exit 0
fi

if command -v ab >/dev/null 2>&1; then
  echo "[INFO] Using ab"
  # Convert duration to approximate request count if only seconds are provided
  # For a smoke test, run a fixed number of requests.
  ab -n 1000 -c "${CONNECTIONS}" "${TARGET_URL}"
  exit 0
fi

echo "[WARN] Neither wrk nor ab found; falling back to curl loop (very rough)"
end=$((SECONDS + 10))
count=0
fail=0
while [ $SECONDS -lt $end ]; do
  if curl -fsS "${TARGET_URL}" >/dev/null 2>&1; then
    count=$((count + 1))
  else
    fail=$((fail + 1))
  fi
done

echo "[INFO] curl loop complete: ok=${count} fail=${fail}"



