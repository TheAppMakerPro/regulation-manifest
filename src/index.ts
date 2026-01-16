import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Starting Regulation Manifest ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CWD:', process.cwd());

// Use absolute path for database
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'prisma', 'data');
const dbPath = path.join(dataDir, 'tanker-calendar.db');

console.log('Project root:', projectRoot);
console.log('Database path:', dbPath);

// Ensure database directory exists
if (!fs.existsSync(dataDir)) {
  console.log('Creating database directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('prisma dir contents:', fs.readdirSync(path.join(projectRoot, 'prisma')));
console.log('prisma/data contents:', fs.readdirSync(dataDir));
console.log('DB exists:', fs.existsSync(dbPath));

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('DB file size:', stats.size, 'bytes');
}

// Set DATABASE_URL with absolute path BEFORE importing anything that uses Prisma
const absoluteDbUrl = `file:${dbPath}`;
process.env.DATABASE_URL = absoluteDbUrl;
console.log('DATABASE_URL set to:', absoluteDbUrl);

// Run migrations if database doesn't exist or is empty
if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
  console.log('Database not found or empty, running migrations and seed...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    console.log('Migrations and seed completed');
  } catch (error) {
    console.error('Migration/seed failed:', error);
  }
}

// Now dynamically import routes AFTER database is configured
async function startServer() {
  const { default: authRoutes } = await import('./routes/auth.js');
  const { default: userRoutes } = await import('./routes/user.js');
  const { default: vesselRoutes } = await import('./routes/vessels.js');
  const { default: companyRoutes } = await import('./routes/companies.js');
  const { default: seatimeRoutes } = await import('./routes/seatime.js');
  const { default: reportRoutes } = await import('./routes/reports.js');
  const { default: regulationsRoutes } = await import('./routes/regulations.js');
  const { errorHandler } = await import('./middleware/errorHandler.js');

  console.log('All routes imported successfully');

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? true
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
}

startServer().catch(console.error);
