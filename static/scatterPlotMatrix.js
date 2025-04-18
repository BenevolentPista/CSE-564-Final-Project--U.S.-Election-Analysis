// Constructs the table that displays the squared sums of loading
function constructTable(data){
    // Select top 4 attributes
    data = data.slice(0, 4);

    // Clear existing canvas (if necessary)
    d3.select("#squaredSumTable").selectAll("*").remove();

    const width = 500;

    // Append the <p> element for the title with specific styles
    d3.select("#squaredSumTable")
        .append("p")
        .style("font-weight", "bold")
        .style("font-size", "1.5rem")
        .style("margin-top", "-8px")
        .text("Squared sum of PCA Loadings");

    var table = d3.select("#squaredSumTable")
        .append("table") // Append the table element
        .attr("width", width);

    // Create table header
    var thead = table.append("thead");
    thead.append("tr")
        .selectAll("th")
        .data(["Attributes", "Sum of Squared Loadings"]) // Update column names
        .enter()
        .append("th")
        .text(function(d) { return d; });

    // Create table body
    var tbody = table.append("tbody");
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // Create cells in each row
    rows.selectAll("td")
        .data(function(row) {
            return [row['Variable'], row["Squared Loading Sum"]]; // Data for each cell
        })
        .enter()
        .append("td")
        .text(function(d) { return d; });

    // Add table style
    table.style("border-collapse", "collapse")
        .style("border", "2px solid black");

    table.selectAll("th, td")
        .style("border", "1px solid black")
        .style("padding", "8px")
        .style("text-align", "center");
}

// Main function for creating the scatter plot matrix
function drawScatterPlotMatrix(scaledData, squaredLoadingSums, k) {
    const numOfVariables = 4;  // Number of attributes in the table; As per the assignment it should be 4
    var variables = [];

    var clusterColumn = "Cluster_ID_k" + k;
    console.log("Cluster column = " + clusterColumn);
    var clusters = scaledData[clusterColumn];
    console.log(clusters);
    
    // Collect variable names based on squaredLoadingSums
    for (let i = 0; i < numOfVariables; i++) {
        variables.push(squaredLoadingSums[i]['Variable']);
    }
    console.log(variables);

    // Dimensions for each scatter plot
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = 320;
    const height = 155;
    const padding = 40;

    // Set up the dimensions of the matrix
    const svgWidth = numOfVariables * (width + padding) + margin.left + margin.right;
    const svgHeight = numOfVariables * (height + padding) + margin.top + margin.bottom;

    // Clear existing canvas
    d3.select("#scatterPlotMatrix").selectAll("*").remove();

    const svg = d3.select("#scatterPlotMatrix").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const title = "Scatter Plot Matrix";
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", 5 + margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    // Create the scales for the x and y axes
    const xScales = {};
    const yScales = {};

    // Create the scales for each variable
    variables.forEach((varName) => {
        const values = Object.values(scaledData[varName]);
        const xScale = d3.scaleLinear()
            .domain([d3.min(values)-0.5, d3.max(values)+0.5])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(values)-0.5, d3.max(values)+0.5])
            .range([height, 0]);

        xScales[varName] = xScale;
        yScales[varName] = yScale;
    });

    // Define color scale based on clusters
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Loop through all combinations of rowVar and colVar to populate the matrix
    variables.forEach((rowVar, i) => {
        variables.forEach((colVar, j) => {
            const g = svg.append("g")
                .attr("transform", `translate(${j * (width + padding) + margin.left}, ${i * (height + padding) + margin.top})`);

            // Draw each individual scatter plot in the matrix
            drawScatterPlot(g, scaledData, xScales[colVar], yScales[rowVar], rowVar, colVar, width, height, clusters, colorScale);
        });
    });

    console.log("Visualizing scatterPlotMatrix Done");
}

// Used for plotting each individual scatter plot
function drawScatterPlot(g, data, xScale, yScale, rowVar, colVar, width, height, clusters, colorScale) {
    // Plot the scatter points
    g.selectAll(".dot")
        .data(Object.values(data[rowVar]))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d, idx) => xScale(Object.values(data[colVar])[idx]))
        .attr("cy", (d) => yScale(d))
        .attr("r", 4)
        .style("fill", function(d, i) {return colorScale(clusters[i])}); // Color based on cluster

    // Add x-axis for the scatter plot
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // Add y-axis for the scatter plot
    g.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label (below the plot)
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 30)
        .style("text-anchor", "middle")
        .text(colVar);

    // Add y-axis label (on the left of the plot)
    g.append("text")
        .attr("x", (-height / 2))
        .attr("y", -35)
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text(rowVar);
}
