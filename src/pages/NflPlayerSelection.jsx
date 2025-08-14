import React, { useState } from 'react';
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
  if (specialCases[lowerStr]) return specialCases[lowerStr];

  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

const allTeams = [
  'BUF','KC','PHI','SF','PIT','JAX','BAL','LAR','NE','GB','MIN','NO','SEA',
  'TEN','CIN','CLE','MIA','IND','ARI','LV','NYG','DET','ATL','HOU','CAR','WAS',
  'DEN','CHI','TB','LAC','NYJ','DAL'
];

export default function NflPlayerSelection() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [homeAway, setHomeAway] = useState('home');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async () => {
    if (!selectedPlayer || !opponent) {
      setError('Please select player and opponent');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/predict_nfl`, {
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
  };

  return (
    <div className={styles.container}>
      {!selectedPlayer ? (
        <NFLPlayerSearch onSelect={setSelectedPlayer} />
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
                <option key={team} value={team}>{team}</option>
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
                {Object.entries(prediction.predicted_stats || {}).map(([stat, val]) => (
                  <li key={stat}>
                    <strong>{formatLabel(stat)}:</strong> {val.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p><strong>Fantasy Points:</strong> {prediction.predicted_fantasy_points}</p>
            </div>
          )}

          <button
            className={styles.backButton}
            onClick={() => {
              setSelectedPlayer(null);
              setPrediction(null);
              setError('');
              setOpponent('');
              setHomeAway('home');
            }}
          >
            Back to Search
          </button>
        </>
      )}
    </div>
  );
}
