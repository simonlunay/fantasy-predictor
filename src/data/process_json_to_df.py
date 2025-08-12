import pandas as pd
import json

# Load your JSON
with open('nba_player_stats_by_defense.json') as f:
    data = json.load(f)

rows = []
for player in data:
    base = {
        'player': player['player'],
        'season': player['season']
    }

    for tier in ['top10', 'mid', 'bottom10']:
        stats_vs_tier = player.get(f'stats_vs_{tier}_def', {})
        for loc in ['home', 'away']:
            loc_stats = stats_vs_tier.get(loc, {})
            if loc_stats:
                row = base.copy()
                # Prefix columns with tier and location so ML model sees them separately
                for stat_name, value in loc_stats.items():
                    row[f'{tier}_{loc}_{stat_name}'] = value
                rows.append(row)

df = pd.DataFrame(rows).fillna(0)

# Now, each row represents player stats vs a defense tier at a location
# You can pivot or reshape as needed to create feature vectors for ML

print(df.head())
