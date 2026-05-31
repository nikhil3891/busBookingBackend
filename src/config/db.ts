// src/config/db.ts
// MongoDB connection helper using mongoose.

import mongoose from 'mongoose';
import env from './env';

// connectDB keeps DB logic isolated; await before starting server.
export async function connectDB(): Promise<void> {
  try {
    console.log('📦 Connecting to:', env.mongoUri);

    // mongoose.connect returns a promise; it uses env.mongoUri
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // exit process so orchestration (Docker/PM2) restarts it
    process.exit(1);
  }
}

