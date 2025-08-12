import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import playerRoutes from './src/routes/players.js'; // Your own route file now

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', playerRoutes);

app.get('/', (req, res) => {
  res.send('NBA Player Search API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
