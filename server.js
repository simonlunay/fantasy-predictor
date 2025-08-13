import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import playerRoutes from './src/routes/players.js'; // keep relative to root

const app = express();
const PORT = process.env.PORT || 3000;

// ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/players', playerRoutes); // namespace routes under /api/players

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'public'); // frontend build folder
  app.use(express.static(buildPath));

  // Send index.html for all other routes (React SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // Development root route
  app.get('/', (req, res) => {
    res.send('NBA Player Search API is running (Development)');
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
