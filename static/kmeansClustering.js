function drawKmeansClustering(scaledData, transformedData, k){
    const margin = { top: 40, right: 20, bottom: 60, left: 70 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    var clusterColumn = "Cluster_ID_k" + k;
    console.log("Cluster column = " + clusterColumn);
    var clusters = scaledData[clusterColumn];
    console.log(clusters);
    
    // Clear the canvas
    d3.select("#kmeansClusteringPlot").selectAll("*").remove();

    // Scatter plot container
    const svg = d3.select("#kmeansClusteringPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract x and y coordinates from the dataset
    const dataX = transformedData.map(row => row[0]);
    const dataY = transformedData.map(row => row[1]);

    // Define the x and y axes scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(dataX) - 1, d3.max(dataX) + 1]) 
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(dataY) - 1, d3.max(dataY) + 1])
        .range([height, 0]);

    // Define color scale based on clusters
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add the x-axis to the scatter plot
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // Add the y-axis to the scatter plot
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Plot the dots on the scatter plot and color them based on their cluster
    svg.selectAll(".dot")
        .data(dataX)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d, i) => xScale(dataX[i]))
        .attr("cy", (d, i) => yScale(dataY[i]))
        .attr("r", 5) // Size of the dots
        .style("fill", function(d, i) { console.log("i = " + i + ", Color = " + colorScale(clusters[i])); return colorScale(clusters[i]); }); // Color based on cluster

    // Add the label to the x-axis
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Principal Component 1");

    // Add the label to the y-axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 10 + (-margin.left + 10))
        .attr("text-anchor", "middle")
        .text("Principal Component 2");

    // Add title
    const title = "K-means Clustering Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .style("font-family", "Arial, sans-serif")
        .text(title);

    // Add a legend for the clusters
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${margin.top})`);

    // Create a legend for the clusters
    const clustersUnique = Array.from(new Set(Object.values(clusters))); // Unique cluster labels
    clustersUnique.forEach((cluster, index) => {
        legend.append("circle")
            .attr("cx", (index > 3 ? -70 : -150))
            .attr("cy", (index > 3 ? -110 + index * 20 : -30 + index * 20))
            .attr("r", 6)
            .attr("fill", colorScale(cluster));

        legend.append("text")
            .attr("x", (index > 3 ? -55 : -135))
            .attr("y", (index > 3 ? -105 + index * 20: -25 + index * 20))
            .text("Cluster " + cluster)
            .style("font-size", "12px")
            .style("fill", "black");
    });

    console.log("Visualizing kmeansClustering Done");
}
