import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LeagueSelection.module.css';

import nbaLogo from '../assets/nba.png';
import nflLogo from '../assets/nfl.png';

export default function LeagueSelection() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* NBA Section */}
      <div className={styles.section}>
        <video
          autoPlay
          loop
          muted
          className={styles.video}
          src="/videos/nba.mp4" // Put your NBA clip in public/videos folder
        />
        <div className={styles.overlay}>
          <button className={styles.button} onClick={() => navigate('/nba')}>
            <img src={nbaLogo} alt="NBA" className={styles.logo} />
            <span>NBA</span>
          </button>
        </div>
      </div>

      {/* NFL Section */}
      <div className={styles.section}>
        <video
          autoPlay
          loop
          muted
          className={styles.video}
          src="/videos/nfl.mp4" // Put your NFL clip in public/videos folder
        />
        <div className={styles.overlay}>
          <button className={styles.button} onClick={() => navigate('/nfl')}>
            <img src={nflLogo} alt="NFL" className={styles.logo} />
            <span>NFL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
