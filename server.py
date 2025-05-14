import pandas as pd
import numpy as np
from kneed import KneeLocator
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS  # Importing the CORS library
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.manifold import MDS
from sklearn.metrics import mean_squared_error
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.preprocessing import StandardScaler
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# All Flags
update_map = False
update_bar_1 = False
update_bar_2 = False
update_turnout_scatter = False
update_coord_splitvoting = False
update_pcp = False

# All features
year = 'year'; state = "state_name"; state_code = "state_code"; evs = "evs"; dem_party_candidate = "d_candidate"; dem_party_votes = "total_d_votes"
dem_party_vote_percent = "d_vote_percentage"; dem_party_evs = "d_evs" ;rep_party_candidate = "r_candidate"; rep_party_votes = "total_r_votes"
rep_party_vote_percent = "r_vote_percentage"; rep_party_evs = "r_evs"; others_votes = "total_others_votes"; others_vote_percent = "others_vote_percentage"; total_votes = "total_votes"
margin = "diff_percent"

features = [
    year, state, state_code, dem_party_candidate, dem_party_votes, dem_party_vote_percent, dem_party_evs, rep_party_candidate,
    rep_party_votes, rep_party_vote_percent, rep_party_evs, others_votes, others_vote_percent, total_votes,
]
categorical_features = [state, state_code]

@app.route('/')
def index():
    # Part-1: Load Presidential Results
    # Part-1.1: Read results at the state level
    # Read the data
    df2024_president_statelevel = pd.read_csv('FinalDatasets/2024-president-statelevel-results-final.csv')
    d_party_candidate = df2024_president_statelevel[dem_party_candidate].iloc[0]
    r_party_candidate = df2024_president_statelevel[rep_party_candidate].iloc[0]
    # print(df2024_president_statelevel)
    
    # Select the numeric columns by excluding the non-numeric ones
    numeric_columns = df2024_president_statelevel.columns.difference(categorical_features)

    # Convert those numeric columns to float
    df2024_president_statelevel[numeric_columns] = df2024_president_statelevel[numeric_columns].apply(pd.to_numeric, errors='coerce')
    # print(df2024_president_statelevel)

    # Extract relevant sub information
    state_to_code_dict = dict(zip(df2024_president_statelevel[state], df2024_president_statelevel[state_code]))
    us_code_to_state = {v: k for k, v in state_to_code_dict.items()}
    df_evs = df2024_president_statelevel[[state_code, dem_party_evs, rep_party_evs]]
    evs_dict = df_evs.set_index(state_code).to_dict(orient='index')
    df_state_votes = df2024_president_statelevel[[state_code, evs, total_votes, dem_party_votes, dem_party_vote_percent, rep_party_votes, rep_party_vote_percent, others_votes, others_vote_percent, margin]]
    president_state_votes_dict = df_state_votes.set_index(state_code).to_dict(orient='index')

    # Part-2: Load presidential results at the county level
    # Load Data
    df2024_president_countylevel_votes = pd.read_csv('FinalDatasets/2024-president-countylevel-results-final.csv')

    # Numeric columns for df2024_president_countylevel_votes
    numeric_columns = ['votes_gop', 'votes_dem', 'total_votes', 'diff', 'per_gop', 'per_dem', 'per_point_diff']

    # Convert those numeric columns to float
    df2024_president_countylevel_votes[numeric_columns] = df2024_president_countylevel_votes[numeric_columns].apply(pd.to_numeric, errors='coerce')
    # print(df2024_president_countylevel_votes)

    # Extract county votes
    df2024_president_countylevel_votes = df2024_president_countylevel_votes[[state_code,  "county_name", "votes_gop", "votes_dem", "total_votes", "diff", "per_gop", "per_dem", "per_point_diff"]]
    # president_county_votes_dict = df2024_president_countylevel_votes.set_index([state_code, 'county_name']).to_dict(orient='index')

    president_county_votes_dict = {
        state: (
            group
            .drop(columns=['state_code'])            # optional: you may not need to keep state_code
            .set_index('county_name')                 # now index is just county_name
            .to_dict(orient='index')                  # → { county_name: { votes_gop:…, … } }
        )
        for state, group in df2024_president_countylevel_votes.groupby('state_code')
    }

    # Part-3: Load senate results
    df2024_senate = pd.read_csv('FinalDatasets/2024-senate-results-final.csv')
    df2024_senate_dict = defaultdict(list)

    # Extract senate votes
    df2024_senate_dict = {
        state: {
            row['office_seat_name']: {
                'party1': {
                    'candidate_name': row['candidate_name_1'],
                    'ballot_party':    row['ballot_party_1'],
                    'percent':         row['percent_1'],
                    'votes':           row['votes_1'],
                },
                'party2': {
                    'candidate_name': row['candidate_name_2'],
                    'ballot_party':    row['ballot_party_2'],
                    'percent':         row['percent_2'],
                    'votes':           row['votes_2'],
                },
                'others': {
                    'percent': row['others_percent'],
                    'votes':   row['others_votes'],
                },
                'total_votes':    row['total_votes'],
                'VEP':            row['VEP'],
                'senate_turnout': row['senate_turnout'],
                'margin': row['margin']
            }
            for _, row in group.iterrows()
        }
        for state, group in df2024_senate.groupby('state_code')
    }   

    # Part-4: Load House results
    df2024_house = pd.read_csv('FinalDatasets/2024-house-results-final.csv')
    df2024_house_dict = df2024_house.set_index('district').to_dict(orient='index')

    # Part-5: Load turnout details at president level
    # Load the turnout at the state level
    df2024_turnout_president = pd.read_csv('FinalDatasets/2024-president-turnout-final.csv')
    df2024_turnout_president_dict = df2024_turnout_president.set_index('state_code').to_dict(orient='index')

    # Part-6: Load turnout details at house level
    # Load the turnout at the house level
    df2024_turnout_house = pd.read_csv('FinalDatasets/2024-house-turnout-final.csv')
    df2024_turnout_house_dict = df2024_turnout_house.set_index('district').to_dict(orient='index')

    # Part-7: County details
    df2024_county_details = pd.read_csv('FinalDatasets/2024-county-details-final.csv')

    pcp_columns = ['state_name', 'state_code', 'county_name', 'population', 'turnout_percent', 'diff_percent', 'poverty_percent', 'college_educated_percent', 'households_total', 'households_median_income']
    df2024_county_details = df2024_county_details[pcp_columns]
    df2024_county_details_dict = {
        state: (
            group
            .drop(columns=['state_code'])
            .set_index('county_name')
            .to_dict(orient='index')
        )
        for state, group in df2024_county_details.groupby('state_code')
    }

    # Part-8: Presidential results at the cd level
    # Load Data
    df2024_president_cdlevel_votes = pd.read_csv('FinalDatasets/2024-president-cdlevel-results-final.csv')
    numeric_columns = ['d_total', 'r_total', 'other_total', 'total_votes', 'd_percent', 'r_percent', 'other_percent', 'margin']
    df2024_president_cdlevel_votes[numeric_columns] = df2024_president_cdlevel_votes[numeric_columns].apply(pd.to_numeric, errors='coerce')
    df2024_president_cdlevel_votes_dict = df2024_president_cdlevel_votes.set_index('district').to_dict(orient='index')
    print(df2024_president_cdlevel_votes)

    # Part-9: Load state details
    df2024_state_details = pd.read_csv('FinalDatasets/2024-state-details-final.csv')
    df2024_state_details_dict = df2024_state_details.set_index('state_code').to_dict(orient='index')

    # Part-10: Load race details
    df2024_county_race_details = pd.read_csv('FinalDatasets/2024-county-race-details-final.csv')

    # Race columns
    # raceCountyPcpColumns = ['state_name', 'state_code', 'county_name', 'white_percent', 'black_percent', 'native_percent', 'asian_percent', 'pacific_percent', 'hispanic_percent', 'other_percent']
    # df2024_county_race_details = df2024_county_race_details[raceCountyPcpColumns]
    # raceStatePcpColumns = ['state_name', 'state_code', 'white_percent', 'black_percent', 'native_percent', 'asian_percent', 'pacific_percent', 'hispanic_percent', 'other_percent']
    # df2024_state_race_details = df2024_state_details[raceStatePcpColumns]

    # Covert to dict
    df2024_county_race_details_dict = {
        state: (
            group
            .drop(columns=['state_code'])
            .set_index('county_name')
            .to_dict(orient='index')
        )
        for state, group in df2024_county_race_details.groupby('state_code')
    }

    data = {
        'demPartyCandidate': d_party_candidate,
        'repPartyCandidate': r_party_candidate,
        'stateToCode': state_to_code_dict,
        'codeToState': us_code_to_state,
        'presidentResults':{
            'stateLevel': {
                'evs': evs_dict,
                'votes': president_state_votes_dict
            },
            "countyLevel": {
                'votes': president_county_votes_dict
            },
            "cdLevel":{
                'votes': df2024_president_cdlevel_votes_dict
            }
        },
        'senateResults':{
            'votes': df2024_senate_dict
        },
        'houseResults':{
            'votes': df2024_house_dict
        },
        'turnout':{
            'stateLevel': {
                'details': df2024_turnout_president_dict
            },
            "cdLevel": {
                'details': df2024_turnout_house_dict
            }
        },
        'countyDetails': df2024_county_details_dict,
        'stateDetails': df2024_state_details_dict,
        'countyRaceDetails': df2024_county_race_details_dict,
    }

    return render_template('index.html', data=data)

if __name__ == "__main__":
    app.run(debug=True)
