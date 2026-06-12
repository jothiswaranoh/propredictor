#!/bin/bash

set -e

SERVER="jothiswaranoh5717@172.30.16.130"
REMOTE_PROJECT="/home/jothiswaranoh5717/htdocs/football"

echo "🏗️ Building frontend locally..."
cd ~/workspace/football/web_app

pnpm install
pnpm run build -- --mode production

echo "📤 Uploading frontend build..."

ssh -A "$SERVER" "rm -rf ${REMOTE_PROJECT}/web_app/dist"

scp -r ./dist "$SERVER:${REMOTE_PROJECT}/web_app/"

echo "🚀 Deploying backend..."

ssh -A "$SERVER" << 'EOF'
set -e

cd /home/jothiswaranoh5717/htdocs/football

git fetch origin
git checkout main
git pull origin main

supervisorctl restart football-api
supervisorctl status football-api

echo "✅ Deployment completed successfully"
EOF
