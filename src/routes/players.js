import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nbaPlayersData = [];
let nflPlayersData = [];

// Load the player stats JSON once when server starts
(async () => {
  try {
    const nbaDataPath = path.resolve(__dirname, '..', 'data', 'nba_player_stats_by_defense.json');
    const nbaJsonStr = await fs.readFile(nbaDataPath, 'utf-8');
    nbaPlayersData = JSON.parse(nbaJsonStr);
    console.log(`Loaded ${nbaPlayersData.length} NBA players from JSON`);
  } catch (err) {
    console.error('Failed to load NBA players JSON:', err);
  }

  try {
    const nflDataPath = path.resolve(__dirname, '..', 'data', 'nfl_skill_players_2023_weekly_with_opponent.json');
    const nflJsonStr = await fs.readFile(nflDataPath, 'utf-8');
    nflPlayersData = JSON.parse(nflJsonStr);
    console.log(`Loaded ${nflPlayersData.length} NFL players from JSON`);
  } catch (err) {
    console.error('Failed to load NFL players JSON:', err);
  }
})();

// NBA player search route
router.get('/player', (req, res) => {
  try {
    const searchTerm = req.query.name?.trim().toLowerCase();

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ data: [] }); // Don't search until 2+ chars
    }

    const startsWithMatches = [];
    const includesMatches = [];

    for (const player of nbaPlayersData) {
      if (!player.player) continue;

      const name = player.player.toLowerCase();

      if (name.startsWith(searchTerm)) {
        startsWithMatches.push(player);
      } else if (name.includes(searchTerm)) {
        includesMatches.push(player);
      }

      if (startsWithMatches.length + includesMatches.length >= 20) break;
    }

    const result = [...startsWithMatches, ...includesMatches].slice(0, 20);
    res.json({ data: result });
  } catch (err) {
    console.error('Error in /player route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NFL player search route
router.get('/player_nfl', (req, res) => {
  try {
    const searchTerm = req.query.name?.trim().toLowerCase();

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ data: [] }); // Don't search until 2+ chars
    }

    const startsWithMatches = [];
    const includesMatches = [];
    const seen = new Set();

    for (const player of nflPlayersData) {
      if (!player.player_name) continue;

      const name = player.player_name.toLowerCase();

      if (seen.has(name)) continue; // Skip duplicates

      if (name.startsWith(searchTerm)) {
        startsWithMatches.push(player);
        seen.add(name);
      } else if (name.includes(searchTerm)) {
        includesMatches.push(player);
        seen.add(name);
      }

      if (startsWithMatches.length + includesMatches.length >= 20) break;
    }

    const result = [...startsWithMatches, ...includesMatches].slice(0, 20);

    const playerNames = result.map(p => p.player_name);

    res.json({ data: playerNames });
  } catch (err) {
    console.error('Error in /player_nfl route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
