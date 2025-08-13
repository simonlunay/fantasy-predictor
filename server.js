import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import playerRoutes from './src/routes/players.js'; // your route file

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());           // Allow requests from any origin
app.use(express.json());   // Parse JSON bodies

app.use('/api', playerRoutes);

app.get('/', (req, res) => {
  res.send('NBA Player Search API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
