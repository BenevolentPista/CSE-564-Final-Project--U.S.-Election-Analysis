function drawDataMDSPlot(scaledData, dataMDS, k){
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    var label1 = "MDS Axis-1";
    var label2 = "MDS Axis-2";

    var clusterColumn = "Cluster_ID_k" + k;
    console.log("Cluster column = " + clusterColumn)
    var clusters = Object.values(scaledData[clusterColumn]);
    console.log(clusters);

    // Clear the canvas
    d3.select("#dataMdsPlot").selectAll("*").remove();

    // Scatter plot container
    const svg = d3.select("#dataMdsPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Extract data from biPlotData
    var data1 = dataMDS.map(row => row[0]);
    var data2 = dataMDS.map(row => row[1]);

    // Define scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data1) - 1, d3.max(data1) + 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data2) - 1, d3.max(data2) + 1])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Define color scale based on clusters
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Plot the dots on the scatter plot
    svg.selectAll(".dot")
        .data(data1)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d, i) { return xScale(d); })
        .attr("cy", function(d, i) { return yScale(data2[i]); })
        .attr("r", 3)
        .style("fill", function(d, i) { console.log("i = " + i + ", clusters[i] = " + clusters[i] + ", color = " + colorScale(clusters[i])); return colorScale(clusters[i]); });

    // Add labels to the axes
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text(label1);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 10 + (-margin.left + 10))
        .attr("text-anchor", "middle")
        .text(label2);

    // Add title
    const title = "MDS Data Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("Visualizing MDS Data plot done");
}

function drawVariablesMDSPlot(variablesMDS, quantitativeFeatures){
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    var label1 = "Variables MDS Axis-1";
    var label2 = "Variables MDS Axis-2";

    // Clear the canvas
    d3.select("#variablesMdsPlot").selectAll("*").remove();

    // Scatter plot container
    const svg = d3.select("#variablesMdsPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Extract data from biPlotData
    var data1 = variablesMDS.map(row => row[0]);
    var data2 = variablesMDS.map(row => row[1]);

    // Define scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data1) - 1, d3.max(data1) + 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data2) - 1, d3.max(data2) + 1])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    const excludedColors = new Set(d3.schemeCategory10);
    const attributeColors = [
        "#E69F00", // Orange
        "#56B4E9", // Light Blue
        "#98ff98", // Indigo (Replaced Green)
        "#F0E442", // Yellow
        "#0072B2", // Dark Blue
        "#D55E00", // Red-Orange
        "#8B0000", // Dark Red
        "#999999", // Gray
        "#6A3D9A", // Purple
        "#1B9E77", // Teal
        "#F564E3", // Magenta-Pink
        "#8C564B"  // Brown
    ].filter(color => !excludedColors.has(color));        

    // Plot the dots on the scatter plot
    svg.selectAll(".dot")
        .data(data1)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("id", function(d, i) { return quantitativeFeatures[i];})
        .attr("cx", function(d, i) { return xScale(d); })
        .attr("cy", function(d, i) { return yScale(data2[i]); })
        .attr("r", 5)
        .style("fill", function(d, i) { return attributeColors[i]; })
        .style("cursor", "pointer")
        .on("click", function (event, d) {
            toggleSelection(d, d3.selectAll(".dot").nodes().indexOf(this), this);
        });

    // Add labels to the axes
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text(label1);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 10 + (-margin.left + 10))
        .attr("text-anchor", "middle")
        .text(label2);

    // Add a legend for the clusters
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${margin.top})`);

    // Create a legend for the variables
    quantitativeFeatures.forEach((cluster, index) => {
        legend.append("circle")
            .attr("cx", (index > 5 ? -140 : -410))
            .attr("cy", (index > 5 ? -150 + index * 20 : -30 + index * 20))
            .attr("r", 6)
            .attr("fill", attributeColors[index]);

        legend.append("text")
            .attr("x", (index > 5 ? -125 : -395))
            .attr("y", (index > 5 ? -145 + index * 20: -25 + index * 20))
            .text(cluster)
            .style("font-size", "12px")
            .style("fill", "black");
    });

    // Add title
    const title = "MDS Variables Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("Visualizing MDS Variables plot done");
}

// Function to toggle selection
function toggleSelection(d, i, element) {
    const key = i; // Using index as identifier

    if (selectedPoints.has(key)) {
        selectedPoints.delete(key);
        d3.select(element).attr("stroke", "black").attr("stroke-width", 1); // Deselect
    } else {
        selectedPoints.add(key);
        d3.select(element).attr("stroke", "black").attr("stroke-width", 4); // Select
    }

    console.log("Selected points:", Array.from(selectedPoints));
    if (selectedPoints.size != 0){
        d3.select("#reorderAxes")
            .style("display", "block")
            .text("Reorder the axes in the PCP");  // Change text based on the click state
    }
    else{
        d3.select("#reorderAxes")
            .style("display", "none")
    }
}