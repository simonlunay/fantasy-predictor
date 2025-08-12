import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Pages
import LeagueSelection from './pages/LeagueSelection';
import NflPlayerSelection from './pages/NflPlayerSelection';
import NbaPlayerSelection from './pages/NbaPlayerSelection';
import styles from './App.module.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* App Header as a link */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 className={styles.appHeader}>Sports Stat Predictor</h1>
        </Link>

        <Routes>
          {/* League selection at home */}
          <Route path="/" element={<LeagueSelection />} />

          {/* NBA Player Search and Prediction */}
          <Route path="/nba" element={<NbaPlayerSelection />} />

          {/* NFL (optional) */}
          <Route path="/nfl" element={<NflPlayerSelection />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
