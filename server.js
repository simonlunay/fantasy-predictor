

import express from 'express';
import cors from 'cors';
import playerRoutes from './src/routes/players.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests only from your Vercel frontend
app.use(cors({
  origin: 'https://fantasy-predictor-pi.vercel.app/', // replace with your frontend URL
}));

app.use(express.json());

// API routes
app.use('/api', playerRoutes);

// Optional root route
app.get('/', (req, res) => {
  res.send('NBA Player Search API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
