import { io, type Socket } from 'socket.io-client';
import type { SocketClientEvents, SocketServerEvents } from './socketTypes';


type AppSocket = Socket<SocketServerEvents, SocketClientEvents>;

let socket: AppSocket | null = null;
let activeToken: string | null = null;

function resolveSocketUrl(): string {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitUrl) return explicitUrl;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) return 'http://localhost:3000';
  if (apiBaseUrl.startsWith('/')) return window.location.origin;

  try {
    const parsed = new URL(apiBaseUrl);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

export function getSocket(): AppSocket | null {
  return socket;
}

export function connectSocket(token: string): AppSocket {
  if (socket && activeToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  activeToken = token;
  socket = io(resolveSocketUrl(), {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  activeToken = null;
}
