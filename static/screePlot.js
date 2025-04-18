function drawScreePlot(values, intrinsicDimensionality) {
    console.log("Dimensionality = " + intrinsicDimensionality);

    var categoryCount = values.length;
    categories = [];
    console.log(values);
    for (let i = 1; i <= categoryCount; i++) {
        categories.push("PCA" + i);
    }

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear the canvas before updating
    d3.select("#screePlot").selectAll("*").remove();

    // Current red bar index
    var currRedBar = intrinsicDimensionality - 1;

    // Bar chart
    var svg = d3.select("#screePlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")");

    // Set the scales
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1]);

    const x = d3.scaleBand()
        .range([0, width + 10])
        .domain(categories)
        .padding(0.5); 

    // Create the x and y axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d3.format(".0%"));

    // Create bars
    svg.selectAll(".bar")
        .data(values)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("id", (d, i) => "bar" + i)
        .attr("x", function (d, i) { return x(categories[i]); })
        .attr("y", function (d) { return y(d); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d); })
        .style("fill", function (d, i) {
            // Color the bar red if its index matches the intrinsic dimensionality
            if (i == intrinsicDimensionality - 1) {
                return "red"; // Default color is red
            }
            return "rgb(54, 49, 203)";
        })
        .on("click", function (d) {
            // Extract the index of the bar
            var i = +d.srcElement.id.match(/\d+/)[0]; // \d+ matches one or more digits
            
            if (i !== currRedBar) {
                // Set clicked bar to red
                d3.select(this).style("fill", "red");

                svg.selectAll(".bar").each(function (d, i) {
                    if (i === currRedBar){
                        d3.select(this).style("fill", "rgb(54, 49, 203)");
                    }
                });

                // Update the current red bar index
                currRedBar = i;
                updateScatterPlots(i+1)
            }
        })
        .on("mouseover", function (event, d) {
            // Lighten fill color on hover for bars that are not red
            var currColor = d3.select(this).style("fill");
            if (currColor !== "red") {
                d3.select(this).style("fill", d3.rgb("rgb(54, 49, 203)").brighter(1)); // Brighter color1 on hover
            }
        })
        .on("mouseout", function (event, d) {
            // Reset color on mouseout for bars that are not red
            var currColor = d3.select(this).style("fill");
            if (currColor !== "red") {
                d3.select(this).style("fill", "rgb(54, 49, 203)"); // Reset to color1
            }
        });

    // Add the x axis with tilted labels
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle") // Center the text

    // Add the y axis
    svg.append("g")
        .call(yAxis);

    // Add labels for the x and y axes
    var label1 = "Principal Component";
    var label2 = "Variance Percentage";

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40) // Adjust positioning slightly
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
    const title = "Scree Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("Visualizing screePlot Done");
}

function updateScatterPlots(updatedDimensionality){
    console.log("Called function");

    // Send AJAX request to Flask
    fetch('/run_matrixcalculation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updatedDimensionality: updatedDimensionality })
    })
    .then(response => response.json())
    .then(newdata => {
        console.log('Response from Flask:', newdata);

        console.log(squaredLoadingSums);
        squaredLoadingSums = newdata.squaredLoadingSums;
        console.log(squaredLoadingSums);
        if(screeInteractivity){
            constructTable(squaredLoadingSums);
            drawScatterPlotMatrix(data.scaledData, squaredLoadingSums, clusterCount);   
        }
        console.log("Redrawing scatter plots done");
    })
    .catch(error => {
        console.error('Error:', error);
    });
}