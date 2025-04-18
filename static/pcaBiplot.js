function drawPCABiPlot(scaledData, biPlotData, quantitativeFeatures, pca1, pca2, k) {
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    var label1 = "Principal Component 1";
    var label2 = "Principal Component 2";

    var clusterColumn = "Cluster_ID_k" + k;
    var clusters = scaledData[clusterColumn];

    // Clear the canvas
    d3.select("#biPlot").selectAll("*").remove();

    // Scatter plot container
    const svg = d3.select("#biPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Extract data from biPlotData
    var data1 = biPlotData.map(row => row[0]);
    var data2 = biPlotData.map(row => row[1]);

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
        .style("fill", function(d, i) { return colorScale(clusters[i]); });

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
    const title = "PCA Bi-Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    // Create a color scale for the attribute vectors (Loadings)
    const lineColors = [
        "darkred", "darkgreen", "midnightblue", "saddlebrown", "darkviolet",
        "slateblue", "teal", "purplestone", "dimgray", "darkkhaki",
        "indigo", "darkslategray"
    ];

    const vectorLength = 5; // Further reduced scaling factor
    console.log("numerical attributes = ")
    console.log(quantitativeFeatures)
    quantitativeFeatures.forEach((category, i) => {
        const xValue = pca1[i] * vectorLength;
        const yValue = pca2[i] * vectorLength;
        const color = lineColors[i];

        // Draw the black border (thicker line)
        svg.append("line")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(xValue))
            .attr("y2", yScale(yValue))
            .attr("stroke", "black")
            .attr("stroke-width", 4);

        // Draw the actual line (with desired color)
        const line = svg.append("line")
            .attr("id", "line" + i)
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(xValue))
            .attr("y2", yScale(yValue))
            .attr("stroke", color)
            .attr("stroke-width", 2);
    });

    // Add a legend for the attributes
    const legend = svg.append("g")
        .attr("transform", `translate(-100, 20)`);

    quantitativeFeatures.forEach((category, i) => {
        const rect = legend.append("rect")
            .attr("id", "rect" + i)
            .attr("x", (i > 4 ? 405 : 110))
            .attr("y", (i > 4 ? -140 : -40) + i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", lineColors[i]);

        const text = legend.append("text")
            .attr("id", "text" + i)
            .attr("x", (i > 4 ? 420 : 125))
            .attr("y", (i > 4 ? -140 : -40) + i * 20 + 10)
            .attr("fill", "black")
            .text(category)
            .style("font-size", "12px");

        // Add hover functionality to the legend items (rect and text)
        rect.on("mouseover", function() {
            var j = parseInt(d3.select(this).attr("id").match(/\d+/)[0]);
            d3.select("#line" + j).attr("stroke", "white");  // Highlight line
            d3.select("#text" + j).style("font-weight", "bold");  // Make text bold
            d3.select("#rect" + j).attr("stroke-width", 3);  // Thicker rectangle boundary
        }).on("mouseout", function() {
            var j = parseInt(d3.select(this).attr("id").match(/\d+/)[0]);
            d3.select("#line" + j).attr("stroke", lineColors[i]);  // Reset line color
            d3.select("#text" + j).style("font-weight", "normal");  // Reset text to normal weight
            d3.select("#rect" + j).attr("stroke-width", 1);  // Reset rectangle boundary thickness
        });

        text.on("mouseover", function() {
            var j = parseInt(d3.select(this).attr("id").match(/\d+/)[0]);
            d3.select("#line" + j).attr("stroke", "white");  // Highlight line
            d3.select("#text" + j).style("font-weight", "bold");  // Make text bold
            d3.select("#rect" + j).attr("stroke-width", 3);  // Thicker rectangle boundary
        }).on("mouseout", function() {
            var j = parseInt(d3.select(this).attr("id").match(/\d+/)[0]);
            d3.select("#line" + j).attr("stroke", lineColors[i]);  // Reset line color
            d3.select("#text" + j).style("font-weight", "normal");  // Reset text to normal weight
            d3.select("#rect" + j).attr("stroke-width", 1);  // Reset rectangle boundary thickness
        });
    });

    console.log("Visualizing PCABiplot done");
}
