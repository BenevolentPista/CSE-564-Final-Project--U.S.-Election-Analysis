function drawPCPPlot(completeData, quantitativeFeatures, categoricalFeatures, featuresOrdered, k) {
    console.log("Complete Data = ");
    console.log(completeData);

    console.log("Beginning drawPCPPlot")
    console.log("Initial features ordered:")
    console.log(featuresOrdered);

    const margin = { top: 70, right: 20, bottom: 20, left: 20 };
    const width = 1700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    var clusterColumn = "Cluster_ID_k" + k;
    var clusters = Object.values(completeData).map(d => d[clusterColumn]);

    // Define color scale based on clusters
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Clear the canvas
    d3.select("#pcpPlot").selectAll("*").remove();

    const svg = d3.select("#pcpPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const y = {};

    featuresOrdered.forEach(dimension => {
        if (quantitativeFeatures.includes(dimension)){
            y[dimension] = d3.scaleLinear()
                .domain([d3.min(completeData, d => d[dimension])-0.5, d3.max(completeData, d => d[dimension])+0.5])
                .range([height, 0]);
        }
        else{
            y[dimension] = d3.scaleBand()
                .domain(Array.from(new Set(completeData.map(d => d[dimension])))) // Get unique categories
                .range([height, 0])
                .padding(0.1);  // Adds padding between categories
        }
    });

    // Add an x-axis for positioning the dimensions
    const x = d3.scalePoint()
        .domain(featuresOrdered)  // Combine both types
        .range([0, width])
        .padding(1);

    // Draw the lines for each record in the dataset
    svg.selectAll(".line")
        .data(completeData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", function(d) {
            return d3.line()(featuresOrdered.map(function(p) {
                return [x(p), y[p].bandwidth ? y[p](d[p]) + y[p].bandwidth() / 2 : y[p](d[p])];
            }));
        })
        .style("opacity", 0.5)
        .style("stroke", function(d, i) { return colorScale(clusters[i]); })
        .on("mouseover", function(event, d) {
            let hoveredColor = colorScale(clusters[completeData.indexOf(d)]); // Get color of hovered line
            svg.selectAll(".line")
                .transition().duration(200)
                .style("opacity", function(lineData) {
                    return colorScale(clusters[completeData.indexOf(lineData)]) === hoveredColor ? 1 : 0.1;
                });
        })
        .on("mouseout", function() {
            svg.selectAll(".line")
                .transition().duration(200)
                .style("opacity", 0.5); // Restore original opacity
        });

    // Adding drag functionality for axes
    const drag = d3.drag()
        .on("start", function(event, d) {
            console.log("Features ordering at start:")
            console.log(data.featuresOrdered);

            d3.select(this).raise().classed("active", true);
        })
        .on("drag", function(event, d) {
            // x.domain(featuresOrdered.sort((a, b) => x(a) - x(b))); // Reorder features based on position
            d3.select(this).attr("transform", `translate(${event.x}, 0)`);
        })
        .on("end", function(event, d) {
            d3.select(this).classed("active", false);
        
            // Capture updated x positions of all axes
            let positions = [];
            svg.selectAll(".dimension").each(function(dim) {
                var xVal = extractDimensionX(this)
                positions.push({
                    key: dim,
                    x: xVal
                });
            });
        
            // Sort axes based on their x position
            positions.sort((a, b) => a.x - b.x);
            featuresOrdered = positions.map(d => d.key);
        
            // Update x scale domain
            x.domain(featuresOrdered);
        
            // Apply transitions to reposition axes smoothly
            updateAxes(svg, x);
            redrawLines(svg, featuresOrdered, x, y);

            data.featuresOrdered = featuresOrdered;
            console.log("Data features ordering at end:")
            console.log(data.featuresOrdered);
        });        
    
    // Draw the axes for each dimension
    svg.selectAll(".dimension")
        .data(featuresOrdered)  // Combine both types
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", (d, i) => `translate(${x(d)}, 0)`)
        .attr("id", (d, i) => "axis-" + d)
        .attr("data-dimension", (d, i) => d)
        .call(drag)
        .each(function(d) {
            d3.select(this).call(d3.axisLeft(y[d]));
        })
        .append("text")
            .style("text-anchor", "middle")
            .attr("y", -30)
            .style("fill", "black")
            .each(function(d) {
                const text = d3.select(this);
                const words = d.split(" "); // Split label into words (assuming space separation)
                
                words.forEach((word, i) => {
                    text.append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? 0 : 12) // Offset each line
                        .text(word);
                });
            });
    
    svg.selectAll("text")
        .style("font-weight", "bold");

    svg.selectAll(".dimension")
        .each(function(d) {
            let axis = d3.axisLeft(y[d]);
            var axisFeature = d3.select(this).attr("data-dimension");

            var xVal;
            if (categoricalFeatures.includes(axisFeature)){
                if (axisFeature === "Generation"){
                    xVal = -18;
                }
                else{
                    xVal = -27;
                }
            }
            else{
                xVal = -18
            }

            d3.select(this).call(axis)
                .selectAll(".tick text") // Select tick labels
                .each(function() {
                    let text = d3.select(this);
                    text.style("text-anchor", "middle");

                    var alignFlag = false;
                    var string = text.text();
                    if (string === "No Eggs" || string === "Human Like"){
                        alignFlag = true;
                    }

                    let words = text.text().split(" "); // Split label into words
                    text.text(""); // Clear original text

                    words.forEach((word, i) => {
                        if (alignFlag){
                            text.append("tspan")
                                .attr("x", xVal)
                                .attr("dy", i === 0 ? "-0.32em" : "1.0em") // Offset each line
                                .text(word);
                        }
                        else{
                            text.append("tspan")
                                .attr("x", xVal)
                                .attr("dy", i === 0 ? "0.32em" : "1.0em") // Offset each line
                                .text(word);
                        }
                    });

                    alignFlag = false;
                });
        });


    // Add title
    const title = "Parallel Coordinates Plot (PCP)";
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .text(title);

    console.log("After line drawing, features ordered:")
    console.log(featuresOrdered);
}

function updateAxes(svg, x) {
    svg.selectAll(".dimension")
        .transition().duration(500)
        .attr("transform", d => `translate(${x(d)}, 0)`);
}

function redrawLines(svg, featuresOrdered, x, y) {
    console.log("Redrawing lines");

    svg.selectAll(".line")
        .transition().duration(500) // Smooth transition
        .attr("d", function(d) {
            return d3.line()(featuresOrdered.map(function(p) {
                return [x(p), y[p].bandwidth ? y[p](d[p]) + y[p].bandwidth() / 2 : y[p](d[p])];
            }));
        });
}

function extractDimensionX(d){
    const transformAttr = d3.select(d).attr("transform");
    return transformAttr ? parseFloat(transformAttr.match(/translate\(([^,]+)/)[1]) : 0;
}