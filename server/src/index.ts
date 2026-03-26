import express from 'express';
import path from 'path';
import cors from 'cors';
import { connectDb } from './config/db.js';
import { env, clientDistPath } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { scheduleRouter } from './routes/schedule.js';
import { squadsRouter } from './routes/squads.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS: allow multiple origins (Mac/Windows localhost, container host access)
const corsOriginList =
  env.corsOrigins === '*'
    ? true
    : env.corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOriginList,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/squads', squadsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

if (env.serveClient) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use(errorHandler);

async function start() {
  await connectDb();
  const host = process.env.HOST || '0.0.0.0';
  app.listen(env.port, host, () => {
    console.log(`Server running at http://${host}:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
