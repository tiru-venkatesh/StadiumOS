import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.ts';
import { DecodedUser } from '../middleware/auth.ts';

interface CustomSocket extends Socket {
  user?: DecodedUser;
}

export const setupSockets = (io: Server): void => {
  // Authentication middleware for Socket.io
  io.use((socket: CustomSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error('Authentication error: Token required.'));
    }

    // Clean Bearer prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    try {
      const decoded = jwt.verify(cleanToken, env.JWT_SECRET) as DecodedUser;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket: CustomSocket) => {
    const userEmail = socket.user?.email || 'Anonymous';
    const userId = socket.user?.id;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`⚡ Client connected: ${socket.id} (User: ${userEmail}, Role: ${socket.user?.role})`);
    }

    // Join personal user room for direct concessions order state updates
    if (userId) {
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`👥 Socket ${socket.id} joined personal room ${userRoom}`);
      }
    }

    // Join match room to receive room-isolated score/poll updates
    socket.on('match:join', (matchId: string) => {
      if (!matchId || typeof matchId !== 'string') return;
      
      const matchRoom = `match:${matchId}`;
      socket.join(matchRoom);
      
      if (process.env.NODE_ENV !== 'test') {
        console.log(`🏀 Socket ${socket.id} joined match room ${matchRoom}`);
      }
      
      socket.emit('match:joined', { matchId, message: `Successfully subscribed to match ${matchId} live updates.` });
    });

    // Leave match room
    socket.on('match:leave', (matchId: string) => {
      if (!matchId || typeof matchId !== 'string') return;
      
      const matchRoom = `match:${matchId}`;
      socket.leave(matchRoom);
      
      if (process.env.NODE_ENV !== 'test') {
        console.log(`🏀 Socket ${socket.id} left match room ${matchRoom}`);
      }
      
      socket.emit('match:left', { matchId, message: `Successfully unsubscribed from match ${matchId} updates.` });
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      }
    });
  });
};
