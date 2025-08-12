import React, { useState, useEffect } from 'react';
import styles from './NflPlayerSelection.module.css';

const BACKEND_BASE_URL = 'https://fantasy-predictor.onrender.com';

const allTeams = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB',
  'TEN', 'WAS'
];

function PlayerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    const controller = new AbortController();

    fetch(`${BACKEND_BASE_URL}/api/player_nfl?name=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch players');
        }
        return res.json();
      })
      .then((data) => {
        // data.data expected to be an array of player name strings
        setResults(data.data || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
        setResults([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return (
    <div className={styles.playerSearch}>
      <input
        type="text"
        placeholder="NFL Player last name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.searchInput}
        autoFocus
      />
      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.resultsList}>
        {results.map((playerName) => (
          <li
            key={playerName}
            onClick={() => onSelect(playerName)}
            className={styles.resultItem}
          >
            {playerName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NflPlayerSelection() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [homeAway, setHomeAway] = useState('home');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOpponent('');
    setHomeAway('home');
    setPrediction(null);
    setError('');
  }, [selectedPlayer]);

  async function handlePredict() {
    if (!selectedPlayer || !opponent) {
      setError('Please select player and opponent');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/predict_nfl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: selectedPlayer,
          opponent,
          home_away: homeAway,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || res.statusText);
      }

      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      {!selectedPlayer ? (
        <PlayerSearch onSelect={setSelectedPlayer} />
      ) : (
        <>
          <h3 className={styles.title}>Selected Player: {selectedPlayer}</h3>

          <div className={styles.inputGroup}>
            <label htmlFor="opponent">Select Opponent Team:</label>
            <select
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            >
              <option value="">-- Select Team --</option>
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Home or Away:</label>
            <label>
              <input
                type="radio"
                name="homeAway"
                value="home"
                checked={homeAway === 'home'}
                onChange={() => setHomeAway('home')}
              />
              Home
            </label>
            <label>
              <input
                type="radio"
                name="homeAway"
                value="away"
                checked={homeAway === 'away'}
                onChange={() => setHomeAway('away')}
              />
              Away
            </label>
          </div>

          <button onClick={handlePredict} disabled={loading}>
            {loading ? 'Predicting...' : 'Predict Stats'}
          </button>

          {error && <p className={styles.error}>{error}</p>}

          {prediction && (
            <div className={styles.predictionBox}>
              <h4>Predicted Stats</h4>
              <ul>
                {prediction.predicted_stats
                  ? Object.entries(prediction.predicted_stats).map(([stat, val]) => (
                      <li key={stat}>
                        <strong>{stat}:</strong>{' '}
                        {typeof val === 'number' ? val.toFixed(2) : String(val)}
                      </li>
                    ))
                  : 'No predicted stats available.'}

                {typeof prediction.predicted_fantasy_points === 'number' && (
                  <li>
                    <strong>Fantasy Points:</strong>{' '}
                    {prediction.predicted_fantasy_points.toFixed(2)}
                  </li>
                )}
              </ul>
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
