# Internal Communication System API

This is the NestJS backend for the Internal Communication System. It exposes the REST API, authentication, RBAC checks, Prisma database access, and Socket.IO realtime events used by the frontend.

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT access tokens
- HTTP-only refresh token cookies
- Passport JWT
- Socket.IO

## Source Structure

```text
src/
├── auth/                # Login, refresh, password reset, password changes
├── events/              # Events and event participants
├── gateway/             # Socket.IO gateway
├── messages/            # Chat messages, replies, pinned messages
├── notifications/       # User and admin notifications
├── org-units/           # Organization units, tags, positions
├── polls/               # Polls, votes, poll participants
├── prisma/              # Prisma service integration
├── rbac/                # Global and chat permission checks
├── rooms/               # Chat rooms and room members
├── tasks/               # Tasks and task participants
├── topics/              # Chat topics
└── users/               # Users and admin user management
```

## Environment

Create an environment file for production:

```bash
cp .env.production.example .env.production
```

Important variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ics:change_me_db_password@db:5432/icsdb?schema=public
CORS_ORIGINS=https://your-domain.com
JWT_ACCESS_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
REFRESH_COOKIE_SECURE=true
```

For local non-Docker development, `DATABASE_URL` normally points to `localhost` instead of `db`.

## Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations in development:

```bash
npx prisma migrate dev
```

Start the API in watch mode:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Production

In production, migrations must use:

```bash
npx prisma migrate deploy
```

The Docker image runs this command automatically before starting:

```bash
npm run start:prod
```

Seed is intentionally manual:

```bash
docker compose exec api npx prisma db seed
```

Do not run seed on every container startup.

## Docker

Build and run through the root Compose file:

```bash
docker compose build api
docker compose up -d api
```

The API container expects PostgreSQL to be reachable by the Compose service name `db`.

## Authentication Notes

- Access tokens are returned to the frontend and used for authenticated API requests.
- Refresh tokens are stored in HTTP-only cookies.
- `REFRESH_COOKIE_SECURE=true` is required for HTTPS production.
- Password reset is handled locally through administrator approval and temporary passwords.

## Realtime Notes

Socket.IO is used for chat and administrative realtime updates. In production, `/socket.io` must be proxied with WebSocket upgrade headers. The bundled client Nginx config already includes this proxy.
