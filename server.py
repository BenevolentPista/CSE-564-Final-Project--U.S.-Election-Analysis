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

app = Flask(__name__)
CORS(app)

# All features
year = 'Year'; state = "State"; state_code = "State Code"; evs = "EVs"; dem_party_candidate = "Democratic Party Candidate"; dem_party_votes = "Total D Votes"; dem_party_vote_percent = "D Vote Percentage"; dem_party_evs = "D EVs" ;rep_party_candidate = "Republican Party Candidate"; rep_party_votes = "Total R Votes"; rep_party_vote_percent = "R Vote Percentage"; rep_party_evs = "R EVs"; others_votes = "Total Others Votes"; others_vote_percent = "Others Vote Percentage"; total_votes = "Total Votes"

features = [
    year, state, state_code, dem_party_candidate, dem_party_votes, dem_party_vote_percent, dem_party_evs, rep_party_candidate,
    rep_party_votes, rep_party_vote_percent, rep_party_evs, others_votes, others_vote_percent, total_votes,
]
categorical_features = [state, state_code]

@app.route('/')
def index():
    # Read the data
    df = pd.read_csv('FinalDatasets/2024StateLevelResults.csv')
    df.fillna(0, inplace=True)
    df.at[51, state] = "United States"
    df.at[51, state_code] = "US"
    df[evs] = df[dem_party_evs] + df[rep_party_evs]
    d_party_candidate = df[dem_party_candidate].iloc[0]
    r_party_candidate = df[rep_party_candidate].iloc[0]
    print(df)
    
    # Select the numeric columns by excluding the non-numeric ones
    numeric_columns = df.columns.difference(categorical_features)

    # Convert those numeric columns to float
    df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
    print(df)

    # Extract relevant sub information
    state_to_code_dict = dict(zip(df[state], df[state_code]))
    us_code_to_state = {v: k for k, v in state_to_code_dict.items()}
    
    df_evs = df[[state_code, dem_party_evs, rep_party_evs]]
    evs_dict = df_evs.set_index(state_code).to_dict(orient='index')

    df_state_votes = df[[state_code, evs, total_votes, dem_party_votes, dem_party_vote_percent, rep_party_votes, rep_party_vote_percent, others_votes, others_vote_percent]]

    state_votes_dict = df_state_votes.set_index(state_code).to_dict(orient='index')
    
    data = {
        'demPartyCandidate': d_party_candidate,
        'repPartyCandidate': r_party_candidate,
        'stateToCode': state_to_code_dict,
        'codeToState': us_code_to_state,
        'evs': evs_dict,
        'votes': state_votes_dict
    }

    return render_template('index.html', data=data)

if __name__ == "__main__":
    app.run(debug=True)
