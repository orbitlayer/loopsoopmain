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
- **Database:** none. With no `DB_*` env the site runs and the admin uses
  browser (local) storage + the demo-login button. To attach MySQL later, add
  to `~/.loopsoop.env`:

  ```
  DB_HOST=...
  DB_PORT=3306
  DB_USER=...
  DB_PASSWORD=...
  DB_NAME=...
  ```

  then run `./deploy/vps-deploy.sh` again. The admin automatically switches from
  demo/browser storage to the database.

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
