#!/bin/sh
set -e

npx prisma migrate deploy

if [ -f /app/apps/api/dist/src/main.js ]; then
  echo "main.js found, starting server..."
else
  echo "ERROR: main.js NOT FOUND at /app/apps/api/dist/src/main.js"
  ls -la /app/apps/api/dist/ || echo "dist dir missing"
  exit 1
fi

exec node /app/apps/api/dist/src/main
