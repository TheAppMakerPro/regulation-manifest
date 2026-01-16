import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

console.log('=== Starting Regulation Manifest ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('CWD:', process.cwd());

// Ensure database directory exists
const dataDir = './prisma/data';
if (!fs.existsSync(dataDir)) {
  console.log('Creating database directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if database exists and list directory contents
const dbPath = './prisma/data/tanker-calendar.db';
console.log('DB exists:', fs.existsSync(dbPath));
console.log('prisma/data contents:', fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : 'dir not found');
console.log('prisma contents:', fs.existsSync('./prisma') ? fs.readdirSync('./prisma') : 'dir not found');

// Run migrations if database doesn't exist
if (!fs.existsSync(dbPath)) {
  console.log('Database not found, running migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import vesselRoutes from './routes/vessels.js';
import companyRoutes from './routes/companies.js';
import seatimeRoutes from './routes/seatime.js';
import reportRoutes from './routes/reports.js';
import regulationsRoutes from './routes/regulations.js';
import { errorHandler } from './middleware/errorHandler.js';

console.log('All routes imported successfully');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Allow all origins in production (same-origin requests from PWA)
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/seatime', seatimeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/regulations', regulationsRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static client files
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  }
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Regulation Manifest running on http://localhost:${PORT}`);
  console.log(`Serving PWA client from /client`);
});

export default app;
