#!/usr/bin/env bash
#
# Loopsoop → MySQL provisioner for the Hostinger VPS (rootless Docker,
# dev-loopsoop engine). Runs a MySQL container next to loopsoop-web on a shared
# Docker network, with a persistent volume, and loads mysql/*.sql once.
#
# Run this ON the VPS, as the `dev-loopsoop` user, from the repo root:
#     ./deploy/vps-db.sh
#
# Credentials come from ~/.loopsoop.env (never hard-coded here). Required:
#     DB_HOST=loopsoop-db   DB_PORT=3306   DB_NAME=loopsoop
#     DB_USER=loopsoop      DB_PASSWORD=...  MYSQL_ROOT_PASSWORD=...
# After this succeeds, run ./deploy/vps-deploy.sh so the app picks up DB_*.

set -euo pipefail

NETWORK="loopsoop-net"
DB_CONTAINER="loopsoop-db"
DB_VOLUME="loopsoop-db-data"
MYSQL_IMAGE="mysql:8.4"
ENV_FILE="${HOME}/.loopsoop.env"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

[ -f "${ENV_FILE}" ] || { echo "ERROR: ${ENV_FILE} not found — add DB_* first." >&2; exit 1; }
# Load DB_* / MYSQL_ROOT_PASSWORD from the env file.
set -a; . "${ENV_FILE}"; set +a
: "${DB_NAME:?set DB_NAME in ${ENV_FILE}}"
: "${DB_USER:?set DB_USER in ${ENV_FILE}}"
: "${DB_PASSWORD:?set DB_PASSWORD in ${ENV_FILE}}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-${DB_PASSWORD}}"

docker network create "${NETWORK}" >/dev/null 2>&1 || true

if docker ps -a --format '{{.Names}}' | grep -qx "${DB_CONTAINER}"; then
  echo "==> ${DB_CONTAINER} already exists — ensuring it is running and on ${NETWORK}"
  docker network connect "${NETWORK}" "${DB_CONTAINER}" >/dev/null 2>&1 || true
  docker start "${DB_CONTAINER}" >/dev/null 2>&1 || true
else
  echo "==> Starting ${DB_CONTAINER} (${MYSQL_IMAGE})"
  docker run -d \
    --name "${DB_CONTAINER}" \
    --restart unless-stopped \
    --network "${NETWORK}" \
    -e MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}" \
    -e MYSQL_DATABASE="${DB_NAME}" \
    -e MYSQL_USER="${DB_USER}" \
    -e MYSQL_PASSWORD="${DB_PASSWORD}" \
    -v "${DB_VOLUME}":/var/lib/mysql \
    "${MYSQL_IMAGE}"
fi

echo "==> Waiting for MySQL to accept connections ..."
ready=""
for i in $(seq 1 60); do
  if docker exec "${DB_CONTAINER}" mysqladmin ping -h127.0.0.1 -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent >/dev/null 2>&1; then
    ready=1; echo "==> MySQL is up"; break
  fi
  sleep 2
done
[ -n "${ready}" ] || { echo "ERROR: MySQL did not become ready. Recent logs:" >&2; docker logs --tail 50 "${DB_CONTAINER}" >&2 || true; exit 1; }

# Load schema only if it hasn't been loaded (guard on the `categories` table), so
# this script is safe to re-run (the seed INSERTs are not idempotent).
HAS=$(docker exec "${DB_CONTAINER}" mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -N -B -e \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}' AND table_name='categories';" 2>/dev/null || echo 0)

if [ "${HAS}" = "0" ]; then
  echo "==> Loading schema into ${DB_NAME} (mysql/*.sql, in order)"
  for f in mysql/0*.sql; do
    echo "    - ${f}"
    docker exec -i "${DB_CONTAINER}" mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${DB_NAME}" < "${f}"
  done
  echo "==> Schema loaded."
else
  echo "==> Schema already present in ${DB_NAME} — skipping load."
fi

echo "==> Tables now in ${DB_NAME}:"
docker exec "${DB_CONTAINER}" mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -N -B -e "SHOW TABLES;" "${DB_NAME}" | sed 's/^/    /'
echo "==> Done. Next: ./deploy/vps-deploy.sh"
