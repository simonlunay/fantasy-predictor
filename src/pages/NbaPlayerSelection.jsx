import React, { useState, useEffect } from 'react';
import styles from './NbaPlayerSelection.module.css';

const BACKEND_BASE_URL = 'https://fantasy-predictor.onrender.com';

const allTeams = [
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET',
  'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN',
  'NOP', 'NYK', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS',
  'TOR', 'UTA', 'WAS'
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

    fetch(`${BACKEND_BASE_URL}/api/players?name=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch players');
        }
        return res.json();
      })
      .then((data) => {
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
        placeholder="Search players..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.searchInput}
        autoFocus
      />
      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.resultsList}>
        {results.map((player) => (
          <li
            key={player.player}
            onClick={() => onSelect(player)}
            className={styles.resultItem}
          >
            {player.player}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NbaPlayerSelection() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [homeAway, setHomeAway] = useState('home');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset fields when player changes
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
      const res = await fetch(`${BACKEND_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: selectedPlayer.player,
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
          <h3 className={styles.title}>Selected Player: {selectedPlayer.player}</h3>

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
                {Object.entries(prediction).map(([stat, val]) => (
                  <li key={stat}>
                    <strong>{stat}:</strong> {val.toFixed(2)}
                  </li>
                ))}
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
