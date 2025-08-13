import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import playerRoutes from './src/routes/players.js'; // keep relative to root

const app = express();
const PORT = process.env.PORT || 3000;

// For ES modules path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', playerRoutes);

// Serve frontend in production (optional, for Vercel frontend you may not need this)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'public'); // change if frontend build is different
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('NBA Player Search API is running (Development)');
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
