function drawElbowPlot (values, elbowPoint) {
    var categoryCount = values.length;
    categories = [];
    for (let i = 1; i <= categoryCount; i++) {
        categories.push("" + i);
    }

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear the canvas before updating
    d3.select("#elbowPlot").selectAll("*").remove();

    // Line chart
    var svg = d3.select("#elbowPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")");

    // Set the scales
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(values)]);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(categories)
        .padding(0.5);

    // Create the x and y axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y)
        .ticks(5);

    // Create the line
    var line = d3.line()
        .x((d, i) => x(categories[i]) + x.bandwidth() / 2)
        .y(d => y(d));

    // Append the line path to the SVG
    svg.append("path")
        .data([values])
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", "rgb(54, 49, 203)") // Default line color
        .style("fill", "none")
        .style("stroke-width", 2);

    // Add the points on the line
    svg.selectAll(".dot")
        .data(values)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", (d, i) => x(categories[i]) + x.bandwidth() / 2) // Position dots on the line
        .attr("cy", d => y(d))
        .attr("r", 5)
        .style("fill", (d, i) => (i === elbowPoint - 1 ? "red" : "rgb(54, 49, 203)")); // Red point for the elbow point

    // Add the x axis with tilted labels
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle"); // Center the text

    // Add the y axis
    svg.append("g")
        .call(yAxis);

    // Add labels for the x and y axes
    var label1 = "Number of Clusters (K)";
    var label2 = "Mean Squared Error";

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text(label1);

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", (-margin.left + 10))
        .attr("text-anchor", "middle")
        .text(label2);

    // Add title
    const title = "Elbow Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("Visualization of elbowPlot Done");
}
