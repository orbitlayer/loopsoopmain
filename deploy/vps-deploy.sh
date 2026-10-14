#!/usr/bin/env bash
#
# Loopsoop → Hostinger VPS deploy (rootless Docker, dev-loopsoop engine, :8081).
#
# Run this ON the VPS, as the `dev-loopsoop` user, from the repo root:
#     ./deploy/vps-deploy.sh
#
# It builds the image, (re)starts the `loopsoop-web` container publishing host
# port 8081 → container 3000, and health-checks it. Traefik (root engine) then
# serves https://loopsoop.187.126.121.91.sslip.io from host.docker.internal:8081.
#
# No database is required: with no DB_* env the site runs and the admin uses
# browser (local) storage + demo login. To attach MySQL later, add the DB_*
# lines to ~/.loopsoop.env and re-run this script.

set -euo pipefail

IMAGE="loopsoop-web:latest"
NAME="loopsoop-web"
HOST_PORT="${HOST_PORT:-8081}"
ENV_FILE="${HOME}/.loopsoop.env"

# Resolve repo root (parent of this script's dir) and build from there.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

# Shared network so the app can reach the MySQL container (loopsoop-db) by name.
# Created here too (idempotent) so the run below never fails if the DB hasn't
# been provisioned yet. See deploy/vps-db.sh to stand up MySQL + load the schema.
NETWORK="loopsoop-net"
docker network create "${NETWORK}" >/dev/null 2>&1 || true

# 1) Persist a strong SESSION_SECRET so admin sessions survive redeploys.
if [ ! -f "${ENV_FILE}" ]; then
  ( umask 077; printf 'SESSION_SECRET=%s\n' "$(openssl rand -hex 32)" > "${ENV_FILE}" )
  echo "==> Generated a new SESSION_SECRET at ${ENV_FILE}"
fi

echo "==> Building ${IMAGE} (this can take a few minutes on first run)"
docker build -t "${IMAGE}" .

echo "==> (Re)starting container ${NAME} on host port ${HOST_PORT}"
docker rm -f "${NAME}" >/dev/null 2>&1 || true
docker run -d \
  --name "${NAME}" \
  --restart unless-stopped \
  --network "${NETWORK}" \
  -p "${HOST_PORT}:3000" \
  --env-file "${ENV_FILE}" \
  -e NODE_ENV=production \
  -e UPLOADS_DIR=/data/uploads \
  -v loopsoop-uploads:/data/uploads \
  "${IMAGE}"

echo "==> Waiting for the app to answer on http://127.0.0.1:${HOST_PORT} ..."
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${HOST_PORT}"; then
    echo "==> OK — serving on :${HOST_PORT}"
    docker ps --filter "name=${NAME}" --format '    {{.Names}}  {{.Status}}  {{.Ports}}'
    echo "==> Public URL: https://loopsoop.187.126.121.91.sslip.io"
    exit 0
  fi
  sleep 2
done

echo "ERROR: ${NAME} did not become healthy in time. Recent logs:" >&2
docker logs --tail 60 "${NAME}" >&2 || true
exit 1
