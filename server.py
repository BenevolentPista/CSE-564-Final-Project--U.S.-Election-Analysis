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

game_of_origin = 'Game(s) of Origin'; generation = 'Generation'; legendary_status = 'Legendary Status'; evolution_details = 'Evolution Details'; evolution_level = 'Level of Evolution'; pokemon_height = 'Pokemon Height'; pokemon_weight = 'Pokemon Weight'; 
primary_type = 'Primary Type'; secondary_type = 'Secondary Type'; types = 'Types'; male_female_ratio = 'M:F Ratio'; base_happiness = 'Base Happiness'; 
health = 'Health Stat'; attack = 'Attack Stat'; defense = 'Defense Stat'; special_attack = 'Special Attack Stat'; special_defense = 'Special Defense Stat'; 
speed = 'Speed Stat'; base_stat_total = 'Base Stat Total'; catch_rate = 'Catch Rate'; experience_growth = 'Experience Growth'; 
experience_growth_total = 'Experience Growth Total'; primary_egg_group = 'Primary Egg Group'; secondary_egg_group = 'Secondary Egg Group'; 
egg_cycle_count = 'Egg Cycle Count'; na = "NA"; 

features = [
    generation, pokemon_height, pokemon_weight, base_happiness, health, attack, defense, special_attack, special_defense,
    speed, base_stat_total, catch_rate, egg_cycle_count, game_of_origin, primary_type, secondary_type, legendary_status, 
    evolution_details, male_female_ratio,experience_growth, experience_growth_total,
    primary_egg_group, secondary_egg_group
]

# Initialize the feature columns (assuming this is already done in your case)
quantitativeFeatures = [pokemon_height, pokemon_weight, base_happiness, health, attack, defense, special_attack, special_defense,
    speed, base_stat_total, catch_rate, egg_cycle_count]
categorical_features = [
    generation, game_of_origin, primary_type, secondary_type, legendary_status, evolution_details,
    male_female_ratio, experience_growth, experience_growth_total, primary_egg_group, secondary_egg_group]
featuresOrdered = [
    legendary_status, generation, game_of_origin, male_female_ratio, base_happiness, evolution_details,  experience_growth, experience_growth_total, primary_type, secondary_type, catch_rate, pokemon_height, pokemon_weight, health, attack, defense, special_attack, special_defense, speed, base_stat_total, egg_cycle_count, primary_egg_group, secondary_egg_group
]

def find_elbow_point(k_values, mse_scores):
    # Using KneeLocator to find the knee/elbow point
    kneedle = KneeLocator(k_values, mse_scores, curve='convex', direction='decreasing')
    knee_point = kneedle.elbow
    print(f"Knee point: {knee_point}")
    
    return knee_point

@app.route('/run_matrixcalculation', methods=['POST'])
def run_matrixcalculation():
    # Get the updated dimensionality
    req_data = request.json
    updated_dimensionality = int(req_data['updatedDimensionality'])

    # Choose the PCA components less than and equal to di
    loading_data = eigenvectors[:updated_dimensionality]

    # Get the squared sum of loadings
    squared_loadings_sum = np.sum(loading_data**2, axis=0)

    # Create a DataFrame with the squared sum of loadings for each variable
    loading_df = pd.DataFrame({
        'Variable': attributes,
        'Squared Loading Sum': squared_loadings_sum
    })

    # Sort the variables by the squared loading sum in descending order
    loading_df = loading_df.sort_values(by='Squared Loading Sum', ascending=False)

    # Return the data
    loading_data = {
        'squaredLoadingSums': loading_df.to_dict(orient='records'),   
    }

    return jsonify(loading_data)

@app.route('/')
def index():
    # Read the data
    df = pd.read_csv('new_data.csv')
    df[pokemon_height] = np.log(df[pokemon_height])
    df[pokemon_weight] = np.log(df[pokemon_weight])
    df = df.sample(n=250)

    df_numerical = df[quantitativeFeatures]
    print(df_numerical)
    df_categorical = df[categorical_features]
    df_numerical = df_numerical.select_dtypes(include=['float64', 'int64'])

    print("Regular data:")
    # print(df_numerical)
    print("Min Poke Height = ", df_numerical['Pokemon Height'].min())
    print("Max Poke Height = ", df_numerical['Pokemon Height'].max())
    print("Min Poke Weight = ", df_numerical['Pokemon Weight'].min())
    print("Max Poke Weight = ", df_numerical['Pokemon Weight'].max())

    #Part-1: Run PCA
    # Standardize the data
    scaler = StandardScaler()
    global scaled_data, attributes
    scaled_data = pd.DataFrame(scaler.fit_transform(df_numerical.values), index = df_numerical.index, columns = df_numerical.columns)
    attributes = df_numerical.columns

    print("Scaled data:")
    # print(scaled_data)
    print("Min Poke Height = ", scaled_data['Pokemon Height'].min())
    print("Max Poke Height = ", scaled_data['Pokemon Height'].max())
    print("Min Poke Weight = ", scaled_data['Pokemon Weight'].min())
    print("Max Poke Weight = ", scaled_data['Pokemon Weight'].max())

    # Apply PCA
    pca = PCA()
    pca.fit(scaled_data)
    transformed_data = pca.transform(scaled_data)
    biplot_data = transformed_data[:, :2]

    # Eigenvalues and Eigenvectors
    eigenvalues = pca.explained_variance_
    eigenvalues_ratio = pca.explained_variance_ratio_
    global eigenvectors
    eigenvectors = pca.components_

    # Intrinsic Dimensionality: Number of components explaining >= 90% of the variance
    cumulative_variance = np.cumsum(pca.explained_variance_ratio_)
    intrinsic_dimensionality = np.argmax(cumulative_variance >= 0.90) + 1  # +1 because index starts from 0

    # Part-2: Get squared sum of loadings for scatterplot matrix
    # Choose the PCA components less than and equal to di
    loading_data = eigenvectors[:intrinsic_dimensionality]

    # Get the squared sum of loadings
    squared_loadings_sum = np.sum(loading_data**2, axis=0)

    # Create a DataFrame with the squared sum of loadings for each variable
    loading_df = pd.DataFrame({
        'Variable': df_numerical.columns,
        'Squared Loading Sum': squared_loadings_sum
    })

    # Sort the variables by the squared loading sum in descending order
    loading_df = loading_df.sort_values(by='Squared Loading Sum', ascending=False)

    # Part-3: Run K-Means algorithm
    # Perform KMeans clustering for k = 1 to 10 and store MSE and cluster IDs
    mse_scores = []
    k_values = list(range(1, 11)) 
    for k in range(1, 11):
        kmeans_model = KMeans(n_clusters=k, random_state=42)
        kmeans_model.fit(scaled_data)
        
        # Get the mean squared error
        mse = mean_squared_error(scaled_data, kmeans_model.cluster_centers_[kmeans_model.labels_])
        mse_scores.append(mse)
        
        # Add cluster ID to the DataFrame for the current value of k
        scaled_data[f'Cluster_ID_k{k}'] = kmeans_model.labels_

    # Determine the optimal k using the elbow method (kneedle algorithm)
    # print(mse_scores)
    optimal_k = int(find_elbow_point(k_values,mse_scores))

    # Part-4: Add MDS Plots
    # Data MDS Plot (Euclidean distance)
    distance_matrix = pairwise_distances(scaled_data, metric='euclidean')
    mds_data = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
    data_mds_coords = mds_data.fit_transform(distance_matrix)
    
    # Variables MDS Plot (1 - |correlation| distance)
    # print(df_numerical)
    corr_matrix = df_numerical.corr().values
    # print(corr_matrix)
    distance_matrix_vars = 1 - np.abs(corr_matrix)
    # print(distance_matrix_vars)
    mds_vars = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
    variables_mds_coords = mds_vars.fit_transform(distance_matrix_vars)
    # print(variables_mds_coords)

    # Part-5: Pass the data to the client
    # Prepare the data to pass to the template
    df_complete = pd.concat([scaled_data, df_categorical], axis=1)
    df_complete = df_complete.fillna("NA")

    print("Numerical attributes:")
    print(df_numerical.columns.tolist())
    print("Quantitative features:")
    print(quantitativeFeatures)
    print("Categorical attributes:")
    print(categorical_features)

    # print(mse_scores)
    data = {
        'quantitativeFeatures': quantitativeFeatures,
        'categoricalFeatures': categorical_features,
        'featuresOrdered': featuresOrdered,
        'scaledData': scaled_data.to_dict(),  # Scaled input data
        'transformedData': transformed_data.tolist(),  # PCA transformed data
        'completeData': df_complete.to_dict(orient='records'), # Categorical data
        'biPlotData': biplot_data.tolist(),  # PCA1 and PCA2 values
        'eigenValues': eigenvalues.tolist(),  # Eigen values of the data
        'eigenValueRatios': eigenvalues_ratio.tolist(),
        'eigenVectors': eigenvectors.tolist(),  # Eigen vectors of the data
        'intrinsicDimensionality': intrinsic_dimensionality.tolist(),  # The intrinsic dimensionality
        'squaredLoadingSums': loading_df.to_dict(orient='records'),
        'optimalK': optimal_k,  # Optimal number of clusters
        'mseScores': mse_scores,  # MSE scores for plotting the elbow graph
        'kValues': k_values,  # Cluster k values
        'dataMDS': data_mds_coords.tolist(),  # MDS plot data for samples
        'variablesMDS': variables_mds_coords.tolist(),  # MDS plot data for variables
    }

    return render_template('index.html', data=data)

if __name__ == "__main__":
    app.run(debug=True)
