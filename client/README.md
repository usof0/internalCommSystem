# Internal Communication System Frontend

This is the React frontend for the Internal Communication System. It provides the user interface for chat, tasks, events, polls, notifications, user profiles, dashboards, and the administrative control panel.

## Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- RTK Query
- React Router
- Socket.IO client
- CSS modules and shared base variables

## Source Structure

```text
src/
├── api/                 # RTK Query API slices
├── app/                 # Redux store and app slices
├── components/          # Shared reusable components
├── features/            # Feature-specific UI blocks
├── hooks/               # Shared React hooks
├── layouts/             # Application layout and top bar
├── lib/socket/          # Socket.IO client setup
├── pages/               # Route pages
├── router/              # Routing configuration
├── styles/              # Base variables, reset, and global styles
└── types/               # Shared TypeScript types
```

## Environment Variables

For production builds, use:

```bash
cp .env.production.example .env.production
```

Variables:

```env
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_SOCKET_URL=https://your-domain.com
```

When the frontend is served by the bundled Docker/Nginx setup, same-origin values are recommended from the root `.env`:

```env
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=
```

With this configuration, the browser calls the same domain for the API and Socket.IO.

## Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Docker

The frontend Docker image builds the Vite app and serves it with Nginx:

- `/` serves the React SPA.
- React routes fallback to `index.html`.
- `/api/v1` is proxied to the API container.
- `/socket.io` is proxied with WebSocket headers.

Build through the root Compose file:

```bash
docker compose build client
docker compose up -d client
```

## UI Notes

- Use colors from `src/styles/base/variables.css`.
- Keep UI responsive across mobile, tablet, and desktop widths.
- Keep permission-sensitive actions hidden when the user does not have the required permission.
- Prefer shared components and existing page patterns before adding new abstractions.
