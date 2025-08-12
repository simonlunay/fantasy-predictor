from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS
import json
import os
import traceback
import collections

app = Flask(__name__)
CORS(app)

##################
# NBA stuff (unchanged)

DEF_RATINGS = {
    'BOS': 103.9, 'MIL': 104.1, 'MIA': 105.2, 'DEN': 105.7,
    'PHI': 106.3, 'GSW': 106.5, 'MEM': 106.9, 'UTA': 107.1,
    'MIN': 107.4, 'CLE': 107.9, 'NYK': 108.3, 'LAC': 108.5,
    'DAL': 108.9, 'CHA': 109.1, 'ATL': 109.5, 'SAC': 110.0,
    'TOR': 110.4, 'IND': 110.8, 'ORL': 111.2, 'DET': 111.5,
    'HOU': 112.0, 'WAS': 112.3, 'POR': 112.7, 'NOP': 113.1,
    'SAS': 113.4, 'OKC': 113.9, 'LAL': 114.5, 'PHX': 115.0,
    'BKN': 115.3
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NBA_MODEL_PATH = os.path.join(BASE_DIR, 'nba_fantasy_model.joblib')
NBA_JSON_PATH = os.path.join(BASE_DIR, 'src', 'data', 'nba_player_stats_by_defense.json')
NBA_FEATURE_COLUMNS_PATH = os.path.join(BASE_DIR, 'src', 'data', 'feature_columns.json')

# Load NBA model
model = joblib.load(NBA_MODEL_PATH)

try:
    with open(NBA_JSON_PATH, 'r') as f:
        players_json = json.load(f)
except Exception as e:
    print(f"Error loading player JSON data: {e}")
    players_json = []

try:
    with open(NBA_FEATURE_COLUMNS_PATH, 'r') as f:
        feature_columns = json.load(f)
except Exception as e:
    print(f"Error loading feature columns: {e}")
    feature_columns = []

def get_defense_tier(opponent_team):
    rating = DEF_RATINGS.get(opponent_team)
    if rating is None:
        return 'mid'  # Default tier if unknown team
    if rating <= 106.5:
        return 'top10'
    elif rating <= 110.0:
        return 'mid'
    else:
        return 'bottom10'

def build_features(player_data, home_away):
    tiers = ['top10', 'mid', 'bottom10']
    locations = ['home', 'away']
    stats = ['games_played', 'points_avg', 'rebounds_avg', 'assists_avg', 'steals_avg', 'blocks_avg', 'turnovers_avg']

    features = {}

    # Initialize all features to 0.0 (important to match model training)
    for tier in tiers:
        for loc in locations:
            for stat in stats:
                features[f"{tier}_{loc}_{stat}"] = 0.0

    # Populate features from JSON data if present
    for tier in tiers:
        tier_key = f"stats_vs_{tier}_def"
        if tier_key in player_data:
            for loc in locations:
                if loc in player_data[tier_key]:
                    for stat in stats:
                        features[f"{tier}_{loc}_{stat}"] = player_data[tier_key][loc].get(stat, 0.0)

    # Add one-hot encoded home_away feature (model trained with drop_first=True)
    features['home_away_away'] = 1 if home_away == 'away' else 0

    return features

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    player_name = data.get('player')
    opponent = data.get('opponent')
    home_away = data.get('home_away')

    if not player_name or not opponent or home_away not in ['home', 'away']:
        return jsonify({'error': 'Missing or invalid player, opponent, or home_away'}), 400

    player_data = next((p for p in players_json if p['player'] == player_name), None)
    if not player_data:
        return jsonify({'error': 'Player not found'}), 404

    features = build_features(player_data, home_away)
    df = pd.DataFrame([features])

    if feature_columns:
        df = df.reindex(columns=feature_columns, fill_value=0.0)

    # DEBUG: print feature columns and values for NBA
    print("NBA Prediction - feature columns:", feature_columns)
    print("NBA Prediction - feature values:", df.iloc[0].to_dict())

    try:
        preds = model.predict(df)[0]
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

    stat_names = ['points', 'rebounds', 'assists', 'steals', 'blocks']
    prediction = {stat: round(float(val), 2) for stat, val in zip(stat_names, preds)}
 
    fantasy_points = (
        prediction['points']
        + prediction['rebounds'] * 1.2
        + prediction['assists'] * 1.5
        + prediction['steals'] * 3
        + prediction['blocks'] * 3
    )
    prediction['fantasy_points'] = round(fantasy_points, 2)

    return jsonify(prediction)

##########################
# NFL stuff added below

NFL_TEAM_TIERS = {
    # Top tier defenses
    'BUF': 'top',
    'KC': 'top',
    'PHI': 'top',
    'SF': 'top',
    'PIT': 'top',
    'JAX': 'top',
    'BAL': 'top',
    'LAR': 'top',

    # Mid tier defenses
    'NE': 'mid',
    'GB': 'mid',
    'MIN': 'mid',
    'NO': 'mid',
    'SEA': 'mid',
    'TEN': 'mid',
    'CIN': 'mid',
    'CLE': 'mid',
    'MIA': 'mid',
    'IND': 'mid',
    'ARI': 'mid',
    'LV': 'mid',

    # Bottom tier defenses
    'NYG': 'bottom',
    'DET': 'bottom',
    'ATL': 'bottom',
    'HOU': 'bottom',
    'CAR': 'bottom',
    'WAS': 'bottom',
    'DEN': 'bottom',
    'CHI': 'bottom',
    'TB': 'bottom',
    'LAC': 'bottom',
    'NYJ': 'bottom',
    'DAL': 'bottom',
}

QB_MODEL_PATH = os.path.join(BASE_DIR, 'qb_multi_model.joblib')
SKILL_MODEL_PATH = os.path.join(BASE_DIR, 'skill_multi_model.joblib')
NFL_JSON_PATH = os.path.join(BASE_DIR,'src','data', 'nfl_skill_players_2023_weekly_with_opponent.json')

qb_model = joblib.load(QB_MODEL_PATH)
skill_model = joblib.load(SKILL_MODEL_PATH)

try:
    with open(NFL_JSON_PATH, 'r') as f:
        nfl_players_json = json.load(f)
except Exception as e:
    print(f"Error loading NFL player JSON data: {e}")
    nfl_players_json = []

def nfl_get_defense_tier(team_abbr):
    return NFL_TEAM_TIERS.get(team_abbr, 'mid')  # default mid

def format_player_name(full_name):
    parts = full_name.strip().split()
    if len(parts) < 2:
        return full_name
    first_initial = parts[0][0]
    last_name = parts[-1]
    return f"{first_initial}.{last_name}"


@app.route('/predict_nfl', methods=['POST'])
def predict_nfl():
    import collections
    try:
        data = request.get_json()
        print("Received request data:", data)

        player_name = data.get('player')
        opponent = data.get('opponent')
        home_away = data.get('home_away')

        if not player_name or not opponent or home_away not in ['home', 'away']:
            return jsonify({'error': 'Missing or invalid player, opponent, or home_away'}), 400

        player_key = format_player_name(player_name)
        player_data = next((p for p in nfl_players_json if p['player_name'] == player_key), None)
        if not player_data:
            return jsonify({'error': f"Player '{player_name}' not found"}), 404

        position = player_data.get('position', '').upper()
        is_home = 1 if home_away == 'home' else 0
        opponent_tier = nfl_get_defense_tier(opponent)
        tier_value = {'top': 2, 'mid': 1, 'bottom': 0}.get(opponent_tier, 1)

        if position == 'QB':
            feature_cols = [
                'passing_yards_season_avg', 'passing_tds_season_avg', 'interceptions_season_avg',
                'rushing_yards_season_avg', 'rushing_tds_season_avg',
                'receptions_season_avg', 'receiving_yards_season_avg', 'receiving_tds_season_avg',
                'fumbles_lost_season_avg', 'opponent_defense_tier', 'is_home'
            ]
            model = qb_model
            output_stats = ['passing_yards', 'passing_tds', 'interceptions',
                            'rushing_yards', 'rushing_tds',
                            'receptions', 'receiving_yards', 'receiving_tds',
                            'fumbles_lost']
        elif position in ['RB', 'WR', 'TE']:
            feature_cols = [
                'rushing_yards_season_avg', 'rushing_tds_season_avg',
                'receptions_season_avg', 'receiving_yards_season_avg', 'receiving_tds_season_avg',
                'fumbles_lost_season_avg', 'opponent_defense_tier', 'is_home'
            ]
            model = skill_model
            output_stats = ['rushing_yards', 'rushing_tds',
                            'receptions', 'receiving_yards', 'receiving_tds',
                            'fumbles_lost']
        else:
            return jsonify({'error': f"Unsupported position '{position}'"}), 400

        features = {
            'passing_yards_season_avg': float(player_data.get('passing_yards', 0)),
            'passing_tds_season_avg': float(player_data.get('passing_tds', 0)),
            'interceptions_season_avg': float(player_data.get('interceptions', 0)),
            'rushing_yards_season_avg': float(player_data.get('rushing_yards', 0)),
            'rushing_tds_season_avg': float(player_data.get('rushing_tds', 0)),
            'receptions_season_avg': float(player_data.get('receptions', 0)),
            'receiving_yards_season_avg': float(player_data.get('receiving_yards', 0)),
            'receiving_tds_season_avg': float(player_data.get('receiving_tds', 0)),
            'fumbles_lost_season_avg': float(player_data.get('fumbles_lost', 0)),
            'opponent_defense_tier': tier_value,
            'is_home': is_home
        }

        X = pd.DataFrame([{col: features.get(col, 0) for col in feature_cols}])
        print("Input features for model:", X)

        preds = model.predict(X)[0]
        print("Raw prediction output:", preds)

        # Safely handle scalar vs iterable predictions
        if isinstance(preds, collections.abc.Iterable) and not isinstance(preds, (str, bytes)):
            prediction = {stat.replace('_', ' '): round(float(val), 2) for stat, val in zip(output_stats, preds)}
        else:
            prediction = {output_stats[0].replace('_', ' '): round(float(preds), 2)}

        print("Processed prediction dict:", prediction)

        # Calculate fantasy points using prediction keys without underscores
        if position == 'QB':
            fantasy_points = (
                prediction.get('passing yards', 0) * 0.04
                + prediction.get('passing tds', 0) * 4
                - prediction.get('interceptions', 0) * 2
                + prediction.get('rushing yards', 0) * 0.1
                + prediction.get('rushing tds', 0) * 6
                + prediction.get('receptions', 0) * 0
                + prediction.get('receiving yards', 0) * 0.1
                + prediction.get('receiving tds', 0) * 6
                - prediction.get('fumbles lost', 0) * 2
            )
        else:
            fantasy_points = (
                prediction.get('rushing yards', 0) * 0.1
                + prediction.get('rushing tds', 0) * 6
                + prediction.get('receptions', 0) * 1
                + prediction.get('receiving yards', 0) * 0.1
                + prediction.get('receiving tds', 0) * 6
                - prediction.get('fumbles lost', 0) * 2
            )

        fantasy_points = round(fantasy_points, 2)
        print("Calculated fantasy points:", fantasy_points)

        return jsonify({
            'predicted_stats': prediction,
            'predicted_fantasy_points': fantasy_points
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Internal error: {str(e)}"}), 500








if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

