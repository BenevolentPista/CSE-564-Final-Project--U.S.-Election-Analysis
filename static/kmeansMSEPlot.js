function drawKMeansMSEPlot(values, elbowPoint) {
    console.log("Beginning K-means MSE");
    console.log(values);
    
    // Creating the categories as a list of the ids of the clusters
    var categoryCount = values.length;
    categories = [];
    for (let i = 1; i <= categoryCount; i++) {
        categories.push("" + i);
    }

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear the canvas before updating
    d3.select("#kmeansMSEPlot").selectAll("*").remove();

    // Current red bar (initially set to elbowPoint-1)
    var currRedBar = elbowPoint - 1;
    console.log("CurrRedBar = ");
    console.log(currRedBar);

    // Bar chart
    var svg = d3.select("#kmeansMSEPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")");

    // Set the scales
    const y = d3.scaleLinear()
        .range([height, 0]) // The bars will go from the bottom to the top
        .domain([0, 1]); // y-axis will go from 0 to the maximum value in the dataset, with a buffer

    const x = d3.scaleBand()
        .range([0, width + 10])
        .domain(categories) // Set x-axis labels based on dataset values
        .padding(0.5); // Padding between bars

    // Create the x and y axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y)
        .ticks(5);

    // Create bars
    svg.selectAll(".bar")
        .data(values)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("id", (d, i) => "bar" + i)
        .attr("x", function (d, i) { return x(categories[i]); }) // Position bars based on x scale (domain is the sale data)
        .attr("y", function (d) { return y(d); }) // Position bars on y scale (based on the data value)
        .attr("width", x.bandwidth()) // Set the width of the bars based on the x scale
        .attr("height", function (d) { return height - y(d); }) // Bar height is determined by the difference between the max height and the y value of the bar
        .style("fill", function (d, i) {
            // Color the bar with value greater than 0.7 as red
            if (i === currRedBar) {
                return "red"; // Red color for the elbow point
            }

            return "rgb(54, 49, 203)"; // Default bar color (color1)
        })
        .on("click", function (event, d) {
            console.log("Clicked on bar")

            // Get the clicked bar's index
            var i = parseInt(d3.select(this).attr("id").match(/\d+/)[0]);
            
            // If the clicked bar is not the same as the current red bar, we change its color to red
            if (i !== currRedBar) {
                console.log("Updated selected bar");

                // Set the clicked bar to red
                d3.select(this).style("fill", "red");

                svg.selectAll(".bar").each(function (d, i) {
                    if (i === currRedBar){
                        d3.select(this).style("fill", "rgb(54, 49, 203)");
                    }
                });

                // Update the current red bar index
                currRedBar = i;
                updateClusters(i+1);
            }
        })
        .on("mouseover", function (event, d) {
            var currColor = d3.select(this).style("fill");

            if (currColor !== "red") {
                d3.select(this).style("fill", d3.rgb("rgb(54, 49, 203)").brighter(1)); // Brighter color1 on hover
            }
        })
        .on("mouseout", function (event, d) {
            var currColor = d3.select(this).style("fill");

            if (currColor !== "red") {
                d3.select(this).style("fill", "rgb(54, 49, 203)");
            }
        });

    // Add the x axis with tilted labels
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

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
    const title = "K-means Mean Squared Error Plot";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("Visualizing kmeansMSEPlot Done");
}

// Redraw specific plots if the number of clusters has been updated
function updateClusters(k){
    clusterCount = k;
    console.log("Redrawing with k = " + clusterCount);

    console.log(squaredLoadingSums);
    if(clusterInteractivity){
        // Replot all scatter plots with new colorings
        drawDataMDSPlot(data.scaledData, data.dataMDS, clusterCount);
        drawPCPPlot(data.completeData, data.quantitativeFeatures, data.categoricalFeatures, data.featuresOrdered, clusterCount);
    }

    console.log("Redrawing plots related to the number of clusters done");
}