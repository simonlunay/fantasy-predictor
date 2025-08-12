import React, { useState, useEffect } from 'react';
import NFLPlayerSearch from './NFLPlayerSearch';
import styles from './NflPlayerSelection.module.css';

const BACKEND_BASE_URL = 'https://fantasy-predictor.onrender.com';

function formatLabel(str) {
  const specialCases = {
    tds: 'TDs',
    yds: 'Yds',
    fpts: 'FPTS',
  };

  const lowerStr = str.toLowerCase();
  if (specialCases[lowerStr]) {
    return specialCases[lowerStr];
  }

  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export default function NflPlayerSelection() {
  // ... your existing state and functions ...

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerInfo(null);
      setNextGame(null);
      setPrediction(null);
      setError('');
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError('');
      setPrediction(null);

      try {
        // Use full backend URL here
        const playerRes = await fetch(
          `${BACKEND_BASE_URL}/api/player?name=${encodeURIComponent(selectedPlayer)}`
        );
        if (!playerRes.ok) throw new Error('Failed to fetch player data');
        const playerData = await playerRes.json();
        const player = playerData.data?.[0];

        if (!player) {
          setError('Player not found in API');
          setLoading(false);
          return;
        }

        setPlayerInfo(player);

        const gameRes = await fetch(
          `${BACKEND_BASE_URL}/api/team-next-game?teamId=${player.team?.id}`
        );
        if (!gameRes.ok) throw new Error('Failed to fetch next game data');
        const gameData = await gameRes.json();

        if (!gameData.data || gameData.data.length === 0) {
          setError("No upcoming games found for this player's team");
          setNextGame(null);
          setLoading(false);
          return;
        }

        const game = gameData.data[0];
        setNextGame(game);

        const isHome = game.home_team?.id === player.team?.id;
        const opponent = isHome
          ? game.visitor_team?.abbreviation
          : game.home_team?.abbreviation;
        const homeAway = isHome ? 'home' : 'away';

        const predRes = await fetch(`${BACKEND_BASE_URL}/api/predict_nfl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: selectedPlayer,
            opponent,
            home_away: homeAway,
          }),
        });

        if (!predRes.ok) {
          const errData = await predRes.json();
          throw new Error(errData.error || 'Failed to fetch prediction');
        }

        const predData = await predRes.json();
        setPrediction(predData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch data');
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedPlayer]);

}
