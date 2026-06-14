#!/bin/bash

set -e

echo "Changing directory..."
cd /var/www/sites/retail-flow

echo "Activating virtual environment..."
source ./backend/.venv/bin/activate

echo "Running migrations..."
python backend/manage.py migrate

echo "Collecting static files..."
python backend/manage.py collectstatic --noinput

echo "Restarting retail-flow service..."
sudo systemctl restart retail-flow

echo "Restarting retail-flow-celery service..."
sudo systemctl restart retail-flow-celery

echo "Deployment completed successfully."