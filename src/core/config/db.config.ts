import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from '../logger/logger';

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () =>
      logger.info('MongoDB connected successfully'),
    );
    mongoose.connection.on('error', (err) =>
      logger.error('MongoDB connection error', { err }),
    );
    mongoose.connection.on('disconnected', () =>
      logger.warn('MongoDB disconnected'),
    );

    await mongoose.connect(env.db.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
