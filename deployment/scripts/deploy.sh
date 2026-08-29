#!/bin/bash

set -e

PROJECT_DIR="/var/www/sites/retail-flow"
SERVICE_NAME="retail-flow"
PORT="8082"

source /var/www/sites/common-server-utilities/scripts/lib/health-check.sh

echo "Changing directory..."
cd "$PROJECT_DIR"

PREV_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $PREV_COMMIT"

echo "Pulling latest code..."
sudo -u ubuntu git pull origin release/prod

echo "Activating virtual environment..."
source ./backend/.venv/bin/activate

echo "Running migrations..."
python backend/manage.py migrate

echo "Collecting static files..."
python backend/manage.py collectstatic --noinput

echo "Restarting $SERVICE_NAME service..."
sudo systemctl restart "$SERVICE_NAME"

echo "Verifying $SERVICE_NAME is healthy..."
if verify_service_health "$SERVICE_NAME" "$PORT"; then
    echo "✅ $SERVICE_NAME is healthy."
    echo "Deployment completed successfully."
else
    echo "❌ $SERVICE_NAME failed its health check. Rolling back to $PREV_COMMIT..."
    sudo -u ubuntu git reset --hard "$PREV_COMMIT"
    python backend/manage.py collectstatic --noinput
    sudo systemctl restart "$SERVICE_NAME"

    if verify_service_health "$SERVICE_NAME" "$PORT"; then
        echo "⚠️  Rolled back to $PREV_COMMIT — the failed deploy was NOT applied."
        echo "⚠️  Any DB migration from the failed deploy is still applied (rollback reverts code only, not schema)."
    else
        echo "🔥 Rollback ALSO failed its health check. Service may be down — manual intervention required."
    fi
    exit 1
fi
