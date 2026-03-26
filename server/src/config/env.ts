import dotenv from 'dotenv';

dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Path to built client (set in Docker; used to serve static + SPA). From dist/config/ we go up to app root then client-dist. */
export const clientDistPath =
  process.env.CLIENT_DIST_PATH || path.join(__dirname, '..', '..', 'client-dist');

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness_goal_system',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  /** Comma-separated list of allowed CORS origins, or "*" to allow any (dev only) */
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5173',
  /** Whether to serve the React app from this server (e.g. in container) */
  serveClient: process.env.SERVE_CLIENT === 'true' || existsSync(clientDistPath),
} as const;
