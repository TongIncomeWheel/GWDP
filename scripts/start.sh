#!/bin/sh
set -e

if [ -n "$LITESTREAM_GCS_BUCKET" ]; then
  cat > /tmp/litestream.yml <<LSEOF
dbs:
  - path: /data/oral_practice.db
    replicas:
      - type: gcs
        bucket: ${LITESTREAM_GCS_BUCKET}
        path: oral_practice.db
LSEOF

  echo "Restoring database from GCS backup..."
  litestream restore -if-replica-exists -config /tmp/litestream.yml /data/oral_practice.db
  echo "Starting app with Litestream replication..."
  exec litestream replicate -exec "node server.js" -config /tmp/litestream.yml
else
  echo "No LITESTREAM_GCS_BUCKET set, running without replication."
  exec node server.js
fi
