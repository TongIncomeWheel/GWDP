#!/bin/sh
set -e

DB_PATH="/data/oral_practice.db"

if [ -n "$LITESTREAM_GCS_BUCKET" ]; then
  echo "Restoring database from GCS backup..."
  litestream restore -if-replica-exists -config /app/litestream.yml "$DB_PATH"
  echo "Starting app with Litestream replication..."
  exec litestream replicate -exec "node server.js" -config /app/litestream.yml
else
  echo "No LITESTREAM_GCS_BUCKET set, running without replication."
  exec node server.js
fi
