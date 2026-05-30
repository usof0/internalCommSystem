# Internal Communication System

Internal Communication System is a full-stack web platform for university or organization communication and operations. It combines realtime chat, tasks, events, polls, notifications, user profiles, and an administrative control panel.

## Project Structure

```text
.
├── client/                 # React + Vite frontend
├── server/                 # NestJS API + Prisma
├── docker-compose.yml      # Production-oriented Compose stack
├── Dockerfile              # Root-compatible API Dockerfile
├── deployment.md           # Detailed Docker and VPS deployment notes
└── README_AR.md            # Arabic server deployment guide
```

## Main Features

- Realtime chat with rooms, topics, pinned messages, replies, threads, and room roles.
- Tasks with participants, status tracking, review flow, deadlines, and late submission handling.
- Events with invitations, participant confirmation, and upcoming/past grouping.
- Polls with voting, results, configurable vote changes, and participant management.
- Notifications, including realtime administrative password reset request alerts.
- User dashboard focused on current work and pending actions.
- Admin panel for users, roles, permissions, password reset requests, organization units, tags, positions, and admin overview.
- Refresh-token authentication with secure HTTP-only cookies.
- Local password reset flow managed by administrators.

## Technology Stack

Frontend:

- React
- TypeScript
- Vite
- Redux Toolkit and RTK Query
- React Router
- Socket.IO client

Backend:

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Socket.IO gateway

Deployment:

- Docker Compose
- PostgreSQL container with persistent volume
- Nginx serving the React SPA and proxying API/WebSocket traffic

## Local Development

Install dependencies separately:

```bash
cd server
npm install

cd ../client
npm install
```

Configure local environment files as needed:

```bash
cp server/.env.production.example server/.env
cp client/.env.production.example client/.env
```

For normal local development, use local URLs in those files rather than production domain values.

Start the backend:

```bash
cd server
npm run start:dev
```

Start the frontend:

```bash
cd client
npm run dev
```

Build both applications:

```bash
cd server
npm run build

cd ../client
npm run build
```

## Docker Deployment

The project includes a production-oriented Docker Compose setup:

- `db`: PostgreSQL.
- `api`: NestJS API, runs `prisma migrate deploy` before `npm run start:prod`.
- `client`: Nginx serving the React build and proxying `/api/v1` and `/socket.io`.

Create environment files:

```bash
cp .env.example .env
cp server/.env.production.example server/.env.production
```

Build and start:

```bash
docker compose build
docker compose up -d
```

Run seed manually only when needed:

```bash
docker compose exec api npx prisma db seed
```

Full deployment instructions are documented in [deployment.md](./deployment.md). Arabic server deployment instructions are available in [README_AR.md](./README_AR.md).

## Useful Commands

```bash
# Backend build
cd server && npm run build

# Frontend build
cd client && npm run build

# Docker logs
docker compose logs -f api
docker compose logs -f client
docker compose logs -f db

# Run production migrations
docker compose exec api npx prisma migrate deploy
```
