import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
}
