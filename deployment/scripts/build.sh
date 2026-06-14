#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"
ENV_FILE="$FRONTEND_DIR/.env"

# Switch VITE_API_URL lines in-place ? only touches those three lines,
# all other vars (Firebase config, Google client ID, etc.) are preserved.
use_prod_env() {
    # Comment out blank/localhost lines, uncomment prod URL
    sed -i 's|^VITE_API_URL=$|#VITE_API_URL=|'                                                                                                       "$ENV_FILE"
    sed -i 's|^VITE_API_URL=http://192\.168\.[0-9.]*:8000|#&|'                                                                                       "$ENV_FILE"
    sed -i 's|^#VITE_API_URL=https://retailflow\.studiobyakshatgadodia\.com|VITE_API_URL=https://retailflow.studiobyakshatgadodia.com|'        "$ENV_FILE"
    echo "==> Switched VITE_API_URL to production"
}

restore_dev_env() {
    # Restore blank VITE_API_URL (Vite proxy handles /api in dev)
    sed -i 's|^VITE_API_URL=https://retailflow\.studiobyakshatgadodia\.com|#VITE_API_URL=https://retailflow.studiobyakshatgadodia.com|' "$ENV_FILE"
    sed -i 's|^#VITE_API_URL=$|VITE_API_URL=|'                                                                                                   "$ENV_FILE"
    echo "==> Restored VITE_API_URL to dev (empty = Vite proxy)"
}
trap restore_dev_env EXIT

step_build_frontend() {
    echo "==> Step 1: Build frontend with production API URL"
    use_prod_env
    echo "    - Running npm run build"
    (cd "$FRONTEND_DIR" && npm run build)
    echo "==> Step 1 complete"
}

step_build_frontend

echo "==> Build script finished successfully"
