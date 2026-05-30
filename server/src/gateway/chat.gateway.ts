import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
      : '*',
    credentials: false,
  },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as Record<string, string>)?.token ??
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      // Every user is automatically in their personal room for notifications
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // Socket.io cleans up rooms automatically on disconnect
  }

  // ─── Client → Server events ───────────────────────────────

  @SubscribeMessage('chat:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    if (!client.data.userId || !payload?.roomId) return;
    client.join(`room:${payload.roomId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    if (!payload?.roomId) return;
    client.leave(`room:${payload.roomId}`);
  }

  // ─── Server → Client helpers ──────────────────────────────

  /** Broadcast an event to all sockets subscribed to a chat room */
  emitToRoom(roomId: string, event: string, data: unknown) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  /** Send an event to all sockets of a specific user */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
