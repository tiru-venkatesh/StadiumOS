import mongoose from 'mongoose';
import { env } from './environment.ts';

let mongoMemoryServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    // Let tests handle their own connection using mongodb-memory-server
    return;
  }

  let dbUri = env.MONGODB_URI;

  // If in development and using default localhost URI, proactively launch in-memory MongoDB server
  if (process.env.NODE_ENV === 'development' && dbUri.includes('localhost')) {
    console.log('🔄 Development environment detected. Launching local in-memory MongoDB server...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      dbUri = mongoMemoryServer.getUri();
      console.log(`✨ Local in-memory MongoDB Server started successfully! URI: ${dbUri}`);
    } catch (err) {
      console.warn('⚠️ Failed to launch mongodb-memory-server:', (err as Error).message);
    }
  }

  try {
    const conn = await mongoose.connect(dbUri);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${(error as Error).message}`);
    
    if (!mongoMemoryServer) {
      console.log('🔄 Attempting fallback to in-memory MongoDB Server...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`🔌 Connected to fallback in-memory MongoDB: ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback to in-memory MongoDB failed:', (fallbackError as Error).message);
      }
    }
    
    console.error('🛑 Application cannot start without a database connection. Exiting...');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected');
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      console.log('🔌 Local in-memory MongoDB Server stopped');
    }
  } catch (error) {
    console.error(`❌ Error disconnecting MongoDB: ${(error as Error).message}`);
  }
};
