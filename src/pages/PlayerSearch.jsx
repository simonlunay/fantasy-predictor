import React, { useEffect, useState } from 'react';

const BACKEND_BASE_URL = 'https://fantasy-predictor.onrender.com';

export default function NBAPlayerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    async function fetchPlayers() {
      if (!debouncedQuery.trim()) {
        setPlayers([]);
        setError('');
        return;
      }

      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/player?name=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setPlayers(data.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching players:', err);
        setPlayers([]);
        setError('Failed to fetch players');
      }
    }

    fetchPlayers();
  }, [debouncedQuery]);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search NBA player"
        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
      />

      {debouncedQuery && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          {error ? (
            <li style={{ padding: '0.5rem', color: 'red' }}>{error}</li>
          ) : players.length > 0 ? (
            players.slice(0, 10).map((p, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    onSelect(p.player); // Send just the player name back
                    setQuery(''); // Optional: clear input after selection
                    setPlayers([]); // Clear suggestions
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    border: 'none',
                    background: 'white',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer'
                  }}
                >
                  {p.player}
                </button>
              </li>
            ))
          ) : (
            <li style={{ padding: '0.5rem' }}>No players found</li>
          )}
        </ul>
      )}
    </div>
  );
}
