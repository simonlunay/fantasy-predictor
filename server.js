import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import playerRoutes from './src/routes/players.js';

const app = express();
const PORT = process.env.PORT || 3000;

// For ES modules path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Not even needed if frontend is served here, but fine to keep
app.use(express.json());

// API routes
app.use('/api', playerRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'public'); // change if your build folder is different
  app.use(express.static(buildPath));

  // Catch-all: send React's index.html for any unknown route
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // Dev mode test route
  app.get('/', (req, res) => {
    res.send('NBA Player Search API is running (Development)');
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
