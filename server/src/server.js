import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { setSocketIoInstance } from './services/mockNotificationService.js';
import { seedDatabase } from './scripts/seed.js';
import { User } from './models/User.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function startServer() {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Auto-seed if database is brand new / empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[BloodConnect] Empty database detected. Auto-seeding initial demo dataset...');
      await seedDatabase();
    }

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Attach Socket.IO for real-time demo events
    const io = new SocketIOServer(server, {
      cors: {
        origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
      },
    });

    setSocketIoInstance(io);

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  🩸 BloodConnect Backend Server Running on Port ${PORT}`);
      console.log(`  🔗 API Root: http://localhost:${PORT}/api`);
      console.log(`  🌐 Health:   http://localhost:${PORT}/api/health`);
      console.log(`  📊 Demo:     http://localhost:${PORT}/api/demo/status`);
      console.log(`======================================================\n`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully closing server and database...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed gracefully.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server Startup Fatal Error]', error);
    process.exit(1);
  }
}

startServer();
