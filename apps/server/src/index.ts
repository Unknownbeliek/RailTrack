import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { getDatabase } from './db';
import { authRouter } from './routes/auth';
import { trainsRouter, setTrainsSocketIO } from './routes/trains';
import { stationsRouter } from './routes/stations';
import { zonesRouter } from './routes/zones';
import { tracksRouter } from './routes/tracks';
import { healthRouter } from './routes/health';
import { setupSocketIO } from './socket/handler';

export async function createApp() {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // Middleware
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Connect Database
  const db = getDatabase();
  await db.connect();

  // Socket.io integration
  setTrainsSocketIO(io);
  setupSocketIO(io);

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/trains', trainsRouter);
  app.use('/api/stations', stationsRouter);
  app.use('/api/zones', zonesRouter);
  app.use('/api/tracks', tracksRouter);

  // Fallback 404 handler for API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return { app, server, io };
}

async function startServer() {
  try {
    const { server } = await createApp();
    const port = config.port;

    server.listen(port, '0.0.0.0', () => {
      console.log(`=================================================`);
      console.log(`  TrackPulse MERN Server listening on port ${port}`);
      console.log(`  Database Provider: ${config.dbType.toUpperCase()}`);
      console.log(`  API Base: http://0.0.0.0:${port}/api`);
      console.log(`  WebSocket Base: ws://0.0.0.0:${port}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
