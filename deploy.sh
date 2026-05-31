#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
ENV_FILE="$FRONTEND_DIR/.env"

PROD_ENV='#VITE_API_URL=http://localhost:8000
#VITE_API_URL=http://192.168.29.31:8000
VITE_API_URL=https://retailflow.studiobyakshatgadodia.com
VITE_GOOGLE_CLIENT_ID=122236657963-2b7t7rcc3ft4ikb7jscagafpmg1m6u4f.apps.googleusercontent.com
'

DEV_ENV='VITE_API_URL=http://localhost:8000
#VITE_API_URL=http://192.168.29.31:8000
#VITE_API_URL=https://retailflow.studiobyakshatgadodia.com
VITE_GOOGLE_CLIENT_ID=122236657963-2b7t7rcc3ft4ikb7jscagafpmg1m6u4f.apps.googleusercontent.com
'

restore_env() {
    printf '%s' "$DEV_ENV" > "$ENV_FILE"
    echo "==> Restored frontend/.env to dev configuration"
}
trap restore_env EXIT

step_build_frontend() {
    echo "==> Step 1: Build frontend with production API URL"

    printf '%s' "$PROD_ENV" > "$ENV_FILE"
    echo "    - Wrote production VITE_API_URL to frontend/.env"

    echo "    - Running npm run build"
    (cd "$FRONTEND_DIR" && npm run build)

    echo "==> Step 1 complete"
}

step_build_frontend

echo "==> Deployment script finished successfully"