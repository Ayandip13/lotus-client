import mongoose from 'mongoose';
import { env } from './env';

export interface DatabaseConnectionStatus {
  isConnected: boolean;
  readyState: number;
  stateText: string;
  host?: string;
  name?: string;
}

const stateNames: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getDatabaseStatus = (): DatabaseConnectionStatus => {
  const state = mongoose.connection.readyState;
  return {
    isConnected: state === 1,
    readyState: state,
    stateText: stateNames[state] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('⚠️ MongoDB connection error:', err.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('ℹ️ MongoDB connection disconnected');
    });

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production',
    });
  } catch (error: any) {
    console.warn(`⚠️ Warning: MongoDB connection failed on startup: ${error.message}`);
    console.warn('   The server will continue running. Ensure MongoDB is running on MONGODB_URI for database-dependent features.');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected gracefully');
  }
};
