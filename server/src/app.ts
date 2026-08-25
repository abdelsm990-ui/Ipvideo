import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import videoRoutes from './routes/video';
import paymentRoutes from './routes/payment';

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Logger
app.use(morgan('dev'));

// JSON parser for all routes (including PayPal webhooks)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ipvideo-api', timestamp: new Date().toISOString() });
});

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible paths (Docker vs native Node.js)
  const possiblePaths = [
    path.join(__dirname, '../client'),      // Docker: /app/dist -> /app/client
    path.join(__dirname, '../../client'),   // Native: /server/dist -> /client
  ];

  let clientPath = possiblePaths.find((p) => fs.existsSync(p));

  if (!clientPath) {
    console.warn('Client directory not found. Checked:', possiblePaths);
    clientPath = possiblePaths[0];
  } else {
    console.log('Serving static files from:', clientPath);
  }

  app.use(express.static(clientPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

export default app;
