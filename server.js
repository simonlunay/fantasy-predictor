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

// API routes (must come before static/catch-all)
app.use('/api/players', playerRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Root folder since index.html is in root
  app.use(express.static(__dirname));

  // Catch-all for React SPA (ignore API routes)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('NBA/NFL Player API running (Development)');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
