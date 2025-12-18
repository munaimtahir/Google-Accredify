#!/bin/sh
# Dependency security checks (best-effort).
#
# Usage:
#   ./scripts/check-security.sh

set -eu

echo "[INFO] Frontend: npm audit (high+)"
npm audit --audit-level=high

echo "[INFO] Backend: pip check"
python -m pip install --upgrade pip >/dev/null
python -m pip install -r backend/requirements.txt >/dev/null
pip check

echo "[INFO] Backend: pip-audit (OSV)"
python -m pip install pip-audit >/dev/null
pip-audit -r backend/requirements.txt

echo "[INFO] Security checks complete"



