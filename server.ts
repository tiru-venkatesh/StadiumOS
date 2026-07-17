import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment & DB imports
import { env } from './src/config/environment.ts';
import { connectDatabase } from './src/config/db.ts';

// Middlewares
import { errorHandler } from './src/middleware/errorHandler.ts';
import { authRateLimiter } from './src/middleware/rateLimiter.ts';

// Routes
import authRouter from './src/routes/auth.routes.ts';
import tournamentRouter from './src/routes/tournament.routes.ts';
import teamRouter from './src/routes/team.routes.ts';
import matchRouter from './src/routes/match.routes.ts';
import pollRouter from './src/routes/poll.routes.ts';
import predictionRouter from './src/routes/prediction.routes.ts';
import orderRouter from './src/routes/order.routes.ts';

// Socket setup
import { setupSockets } from './src/sockets/index.ts';

// ES Module resolution helpers (handled by bundler & node runtime)


const startServer = async () => {
  const app = express();
  
  // Trust proxy for express-rate-limit in container environment
  app.set('trust proxy', 1);

  const httpServer = createServer(app);

  // Initialize Socket.io with HTTP server
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Attach Socket.io to Express application context
  app.set('io', io);
  setupSockets(io);

  // Connect to Database
  await connectDatabase();

  // -------------------------------------------------------------
  // SECURITY MIDDLEWARES
  // -------------------------------------------------------------
  // Prevent HTTP parameter pollution & basic vulnerabilities
  app.use(
    helmet({
      contentSecurityPolicy: false, // Turn off CSP during development if doing nested frames
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Sanitize data against MongoDB Operator Injection
  app.use(mongoSanitize());

  // Parse incoming JSON payloads
  app.use(express.json());

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------
  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, status: 'healthy' });
  });
  app.use('/api/v1/auth', authRateLimiter, authRouter);
  app.use('/api/v1/tournaments', tournamentRouter);
  app.use('/api/v1/teams', teamRouter);
  app.use('/api/v1/matches', matchRouter);
  app.use('/api/v1/polls', pollRouter);
  app.use('/api/v1/predictions', predictionRouter);
  app.use('/api/v1/orders', orderRouter);

  // -------------------------------------------------------------
  // VITE / STATIC FILE SERVING FOR FULL-STACK INTEGRATION
  // -------------------------------------------------------------
  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files from build directory in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling Middleware (must be registered last!)
  app.use(errorHandler);

  // Listen on the designated Port and Host (0.0.0.0 required for container ingress)
  const port = (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) ? 0 : env.PORT;
  httpServer.listen(port, '0.0.0.0', () => {
    if (env.NODE_ENV !== 'test') {
      console.log(`🏟️ StadiumOS Server running in [${env.NODE_ENV}] mode on port ${port}`);
    }
  });

  return { app, httpServer, io };
};

// Auto start server if executed directly (not required as a module in tests)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  startServer().catch((error) => {
    console.error('❌ Failed to start StadiumOS server:', error);
  });
}

export { startServer };
