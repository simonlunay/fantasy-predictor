import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // install node-fetch v3
import playerRoutes from './src/routes/players.js';

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_BACKEND_URL = 'https://python-backend-79vn.onrender.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Player search routes
app.use('/api/players', playerRoutes);

// Proxy /api/predict to Python Flask backend
app.post('/api/predict', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Error forwarding /api/predict:', err);
    res.status(500).json({ error: 'Failed to contact Python backend' });
  }
});

// Proxy /api/predict_nfl to Python Flask backend
app.post('/api/predict_nfl', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict_nfl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Error forwarding /api/predict_nfl:', err);
    res.status(500).json({ error: 'Failed to contact Python backend' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(__dirname));

  // Catch-all: send index.html for React routes, ignore /api routes
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('NBA/NFL Player API running (Development)');
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Python backend URL: ${PYTHON_BACKEND_URL}`);
});
