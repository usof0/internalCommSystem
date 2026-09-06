# Deployment and Dockerization

## What Was Dockerized

The project is prepared for a single-VPS deployment with Docker Compose. The deployment runs:

- `client`: React production build served by Nginx.
- `api`: NestJS production server.
- `db`: PostgreSQL with a persistent Docker volume.

The old Docker startup used development behavior:

- `npm run start:dev`
- `prisma migrate dev`
- automatic `prisma db seed` on every container start

This was replaced with production behavior:

- `npm run start:prod`
- `prisma migrate deploy`
- seed is manual and optional

## Docker Files Added or Updated

- `Dockerfile`: root-compatible API Dockerfile for the existing build path.
- `server/Dockerfile`: production Dockerfile for the NestJS API.
- `client/Dockerfile`: builds React and serves static files with Nginx.
- `client/nginx.conf`: serves the SPA and proxies API/WebSocket traffic.
- `docker-compose.yml`: runs `client`, `api`, and `db`.
- `.dockerignore`, `server/.dockerignore`, `client/.dockerignore`: keep images small and avoid copying local artifacts.
- `.env.example`: root Compose variables.
- `server/.env.production.example`: API production environment example.
- `client/.env.production.example`: frontend build-time environment example.

## Service Layout

```text
Browser
  |
  | https://your-domain.com
  v
client container, Nginx :80
  |-- /              -> React static files
  |-- /api/v1/*      -> api:3000/api/v1/*
  |-- /socket.io/*   -> api:3000/socket.io/*

api container
  |
  v
db container, PostgreSQL :5432
```

The browser talks only to the domain. Internally, Docker Compose resolves services by name: `api` and `db`.

## Required Environment Files

Create a root `.env` from `.env.example`:

```bash
cp .env.example .env
```

Example root `.env`:

```env
POSTGRES_USER=ics
POSTGRES_PASSWORD=change_me_db_password
POSTGRES_DB=icsdb
HTTP_PORT=80
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=
```

Create the API production env:

```bash
cp server/.env.production.example server/.env.production
```

Important values in `server/.env.production`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ics:change_me_db_password@db:5432/icsdb?schema=public
CORS_ORIGINS=https://your-domain.com
JWT_ACCESS_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
REFRESH_COOKIE_SECURE=true
```

The database username, password, and database name must match root `.env`.

For bundled Nginx, the recommended frontend build settings are same-origin:

```env
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=
```

With this setup, Socket.IO uses the current browser origin. That works for local Docker and for the final domain.

## Local Docker Test

Build images:

```bash
docker compose build
```

Start services:

```bash
docker compose up -d
```

Check logs:

```bash
docker compose logs -f api
docker compose logs -f client
docker compose logs -f db
```

Open:

```text
http://localhost
```

Verify:

- React app opens.
- Refreshing a React route does not return 404.
- API works through `http://localhost/api/v1`.
- Login works.
- Refresh token cookie works. If you test locally over plain HTTP, set `REFRESH_COOKIE_SECURE=false` in `server/.env.production`; set it back to `true` for HTTPS deployment.
- Chat realtime works through Socket.IO.

Stop services:

```bash
docker compose down
```

Stop and delete database volume:

```bash
docker compose down -v
```

Use `-v` only when you intentionally want to delete local database data.

## VPS Deployment Steps

1. Install Docker and Docker Compose on the VPS.

2. Point the domain DNS `A` record to the VPS public IP.

3. Clone or pull the project on the VPS.

4. Create env files:

```bash
cp .env.example .env
cp server/.env.production.example server/.env.production
```

5. Edit secrets and domain values:

```bash
nano .env
nano server/.env.production
```

Set:

```env
CORS_ORIGINS=https://your-domain.com
```

6. Build containers:

```bash
docker compose build
```

7. Start services:

```bash
docker compose up -d
```

The API container automatically runs:

```bash
npx prisma migrate deploy
```

before starting the NestJS production server.

8. If this is a new database and you need initial roles/users, run seed manually once:

```bash
docker compose exec api npx prisma db seed
```

Do not run seed automatically on every restart.

## HTTPS Setup

For the committee demo, HTTPS is recommended because production refresh cookies are marked `secure`.

Two acceptable approaches:

1. Use an external reverse proxy on the VPS, such as host-level Nginx with Certbot, and proxy to Docker port `80`.
2. Put a TLS-capable proxy such as Caddy or Traefik in front of this Compose stack.

Recommended simple VPS approach:

- Run this Compose stack on `HTTP_PORT=80`.
- Install Certbot and host Nginx on the VPS.
- Configure host Nginx for `your-domain.com`.
- Proxy traffic to `http://127.0.0.1:80`.
- Let Certbot manage certificates.

If host Nginx listens on ports `80` and `443`, change Compose to expose the app on another local port:

```env
HTTP_PORT=8080
```

Then host Nginx proxies to:

```text
http://127.0.0.1:8080
```

WebSocket proxying must include upgrade headers.

## Operational Commands

Rebuild after code changes:

```bash
docker compose build
docker compose up -d
```

Restart one service:

```bash
docker compose restart api
docker compose restart client
```

Run migrations manually:

```bash
docker compose exec api npx prisma migrate deploy
```

Run seed manually:

```bash
docker compose exec api npx prisma db seed
```

Open database shell:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Backup database:

```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

Restore database:

```bash
cat backup.sql | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## Production Notes

- Do not commit real `.env` or `server/.env.production` secrets.
- Use strong JWT secrets in production.
- Keep `REFRESH_COOKIE_SECURE=true` in HTTPS production. Use `false` only for local HTTP testing.
- `DATABASE_URL` inside Docker must use host `db`, not `localhost`.
- `CORS_ORIGINS` must include the deployed domain.
- `VITE_API_BASE_URL=/api/v1` is preferred for same-origin deployment.
- Socket.IO is proxied through `/socket.io`.
- React routes are handled by Nginx fallback to `index.html`.
- `prisma migrate deploy` is safe for production migrations.
- `prisma migrate dev` is only for local development.
- `prisma db seed` is manual and should not run automatically on every startup.
