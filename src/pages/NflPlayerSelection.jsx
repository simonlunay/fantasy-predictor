import React, { useState, useEffect } from 'react';
import NFLPlayerSearch from './NFLPlayerSearch';
import styles from './NflPlayerSelection.module.css';

console.log('CSS Styles:', styles);

// Format stat labels: special cases + camelCase or underscores → Capitalized words
function formatLabel(str) {
  const specialCases = {
    tds: 'TDs',
    yds: 'Yds',
    fpts: 'FPTS',
    // Add more special cases here if needed
  };

  const lowerStr = str.toLowerCase();
  if (specialCases[lowerStr]) {
    return specialCases[lowerStr];
  }

  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → space separated
    .replace(/_/g, ' ')                   // underscores → spaces
    .replace(/\w\S*/g, txt =>            // Capitalize first letter of each word
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export default function NflPlayerSelection() {
  const players = [
    'Patrick Mahomes',
    'Aaron Rodgers',
    'Tom Brady',
    'Josh Allen',
    'Justin Herbert',
    'Derrick Henry',
    'Davante Adams',
    'Stefon Diggs',
    'Travis Kelce',
    'Lamar Jackson',
    'Joe Burrow',
  ];

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [nextGame, setNextGame] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recursive render function for values; if object, show nested keys formatted
  function renderValue(val) {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'string') return val;

    if (Array.isArray(val)) {
      return val.map((item, i) => (
        <span key={i}>
          {renderValue(item)}
          {i !== val.length - 1 ? ', ' : ''}
        </span>
      ));
    }

    if (typeof val === 'object') {
      return (
        <ul style={{ marginLeft: '1rem' }}>
          {Object.entries(val).map(([key, value]) => (
            <li key={key}>
              <strong>{formatLabel(key)}:</strong> {renderValue(value)}
            </li>
          ))}
        </ul>
      );
    }

    return val.toString();
  }

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
        // Fetch player info
        const playerRes = await fetch(`/api/player?name=${encodeURIComponent(selectedPlayer)}`);
        if (!playerRes.ok) throw new Error('Failed to fetch player data');
        const playerData = await playerRes.json();
        const player = playerData.data?.[0];

        if (!player) {
          setError('Player not found in API');
          setLoading(false);
          return;
        }

        setPlayerInfo(player);

        // Fetch next game info
        const gameRes = await fetch(`/api/team-next-game?teamId=${player.team?.id}`);
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
        const opponent = isHome ? game.visitor_team?.abbreviation : game.home_team?.abbreviation;
        const homeAway = isHome ? 'home' : 'away';

        // Fetch prediction
        const predRes = await fetch('/api/predict_nfl', {
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

  return (
    <div className={styles.container}>
      {!selectedPlayer ? (
        <NFLPlayerSearch players={players} onSelect={setSelectedPlayer} />
      ) : (
        <>
          <h3 className={styles.title}>Selected Player: {selectedPlayer}</h3>

          {loading && <p className={styles.loading}>Loading data...</p>}
          {error && <p className={styles.error}>{error}</p>}

          {playerInfo && nextGame && (
            <div className={styles.playerInfo}>
              <h4>Next Game Info</h4>
              <p>
                Date: {new Date(nextGame.date).toLocaleDateString()}<br />
                Home Team: {nextGame.home_team?.full_name}{' '}
                {nextGame.home_team?.id === playerInfo.team?.id ? '(Home)' : ''}
                <br />
                Visitor Team: {nextGame.visitor_team?.full_name}{' '}
                {nextGame.visitor_team?.id === playerInfo.team?.id ? '(Away)' : ''}
              </p>

              <div className={styles.predictionBox}>
                <h4>AI Stat Prediction</h4>
                {prediction?.predicted_stats ? (
                  <ul>
                    {Object.entries(prediction.predicted_stats).map(([stat, val]) => (
                      <li key={stat}>
                        <strong>{formatLabel(stat)}:</strong> {renderValue(val)}
                      </li>
                    ))}
                    {typeof prediction.predicted_fantasy_points === 'number' && (
                      <li>
                        <strong>Fantasy Points:</strong>{' '}
                        {prediction.predicted_fantasy_points.toFixed(2)}
                      </li>
                    )}
                  </ul>
                ) : loading ? (
                  <p>Loading prediction...</p>
                ) : (
                  <p>No prediction data.</p>
                )}
              </div>
            </div>
          )}

          <button
            className={styles.backButton}
            onClick={() => {
              setSelectedPlayer(null);
              setPrediction(null);
              setError('');
            }}
          >
            Back to Search
          </button>
        </>
      )}
    </div>
  );
}
