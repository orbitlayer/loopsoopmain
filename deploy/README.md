# Deploying Loopsoop to the Hostinger VPS

The site runs as a single Docker container in the **`dev-loopsoop` rootless
engine**, publishing host port **8081**. Traefik (root engine) already routes
`https://loopsoop.187.126.121.91.sslip.io` → `host.docker.internal:8081`, so you
never expose 8081 to the internet (ufw blocks it).

```
visitor ──HTTPS──▶ Traefik :443 ──▶ host.docker.internal:8081 ──▶ loopsoop-web (:3000)
```

## One-time: get the code onto the VPS

SSH in as the developer user and clone the repo (it's private, so authenticate
with a GitHub token or deploy key):

```bash
ssh dev-loopsoop@187.126.121.91
git clone https://github.com/Noopur-design/ipad-repo5.git loopsoop
cd loopsoop
```

## Deploy / redeploy

```bash
./deploy/vps-deploy.sh
```

This builds the image, (re)starts the `loopsoop-web` container with
`--restart unless-stopped`, and health-checks it. To update later:

```bash
git pull && ./deploy/vps-deploy.sh
```

## What it sets up

- **Port:** `8081:3000` (only Traefik reaches it).
- **SESSION_SECRET:** generated once into `~/.loopsoop.env` and reused across
  redeploys (so admin logins stay valid).
- **Uploads:** persisted in the `loopsoop-uploads` Docker volume at
  `/data/uploads` (`UPLOADS_DIR`), surviving redeploys.
- **Database:** optional. With no `DB_*` env the site runs and the admin uses
  browser (local) storage + the demo-login button. To attach a real MySQL,
  run a containerised one next to the app (rootless engine, shared
  `loopsoop-net` network, persistent `loopsoop-db-data` volume):

  1. Add the DB creds to `~/.loopsoop.env` (a strong `DB_PASSWORD` /
     `MYSQL_ROOT_PASSWORD`, e.g. `openssl rand -hex 24`):

     ```
     DB_HOST=loopsoop-db
     DB_PORT=3306
     DB_NAME=loopsoop
     DB_USER=loopsoop
     DB_PASSWORD=...
     MYSQL_ROOT_PASSWORD=...
     ```

  2. `./deploy/vps-db.sh` — starts the `loopsoop-db` MySQL container and loads
     `mysql/*.sql` (schema + seed) once. Safe to re-run.
  3. Seed an admin user (bcrypt hash — generate locally with
     `node scripts/hash-password.mjs "<password>"`):

     ```bash
     docker exec -i loopsoop-db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" loopsoop \
       -e "INSERT INTO users (id,email,password_hash) VALUES (UUID(),'you@example.com','<hash>') \
           ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);"
     ```

  4. `./deploy/vps-deploy.sh` — the app joins `loopsoop-net`, connects to
     `loopsoop-db`, and the admin switches from demo/browser storage to the
     database automatically.

## Handy checks

```bash
docker ps --filter name=loopsoop-web
docker logs -f loopsoop-web
curl -I http://127.0.0.1:8081
curl -I https://loopsoop.187.126.121.91.sslip.io
```

## Keep it running after reboot

Rootless Docker needs user lingering so the engine (and the
`--restart unless-stopped` container) comes back on boot:

```bash
loginctl enable-linger dev-loopsoop   # usually already enabled on these engines
```
