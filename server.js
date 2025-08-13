import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import playerRoutes from './src/routes/players.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/players', playerRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Make sure this points to your **frontend build folder**, e.g., 'public' or 'frontend/dist'
  const buildPath = path.join(__dirname, 'public'); // ← change 'public' if your build folder is different
  app.use(express.static(buildPath));

  // Catch-all route for React SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('NBA/NFL Player API running (Development)');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
