// Function for drawing parallel coordinates plot to compare counties
function drawPcpPlot(details, pcpFeatures, showRace, stateCode = null) {
    const dataLines = [];
    // Compare across all states if no state has been selected
    if (stateCode === null){
        for (const [stateCode, values] of Object.entries(details)) {
            // To not compare the U.S against other states
            if(stateCode === "US"){
                continue;
            }

            const rec = { id: `${stateCode} (${stateCode})` };
            pcpFeatures.forEach(d => {
                if(values.hasOwnProperty(d)){
                    rec[d] = values[d];
                }
            })

            dataLines.push(rec);
        }
    }
    // Draw only for the counties in a selected state
    else{
        for (const [county, values] of Object.entries(details[stateCode])) {
            const rec = { id: `${county}-(${stateCode})` };
            pcpFeatures.forEach(d => {
                if(values.hasOwnProperty(d)){
                    rec[d] = values[d];
                }
            })

            dataLines.push(rec);
        }
    }

    // If no data found for PCP, return
    console.log(`stateCode = ${stateCode}`);
    console.log(dataLines)
    if (!dataLines.length) return;

    const dimensions = Object.keys(dataLines[0])
    .filter(k => k !== "id" && typeof dataLines[0][k] === "number");

    let featuresOrdered = dimensions;
    console.log(`FeaturesOrdered = ${featuresOrdered}`)

    const margin = { top: 80, right: 20, bottom: 10, left: 20 };
    const width  = 960 - margin.left - margin.right;
    const height = 400 - margin.top  - margin.bottom;

    d3.select("#pcpPlot").selectAll("*").remove();
    const svg = d3.select("#pcpPlot")
    .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = {};
    // Draw the y-axis for each dimension
    dimensions.forEach(dim => {
        if (dim === "diff_percent") {
            y[dim] = d3.scaleLinear()
            .domain([0, d3.max(dataLines, d => Math.abs(d[dim]))]).nice()
            .range([height, 0]);
        } else if (dim.includes("percent")) {
            y[dim] = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);
        } else {
            y[dim] = d3.scaleLinear()
            .domain(d3.extent(dataLines, d => d[dim])).nice()
            .range([height, 0]);
        }
    });

    const x = d3.scalePoint()
    .domain(featuresOrdered)
    .range([0, width])
    .padding(0.5);

    // Draw the lines
    const line = d3.line();
    function path(d) {
        return line(
            featuresOrdered.map(dim => {
                const raw = d[dim];
                const val = dim === "diff_percent" ? Math.abs(raw) : raw;
                return [ x(dim), y[dim](val) ];
            })
        );
    }

    svg.selectAll("path.background")
    .data(dataLines)
    .enter().append("path")
        .attr("class","background")
        .attr("d", path)
        .attr("fill","none")
        .attr("stroke","#eee")
        .attr("stroke-width",1);

    // Draw foreground lines
    // These lines are the ones that can be selected
    const fgLines = svg.selectAll("g.fg-line")
    .data(dataLines)
    .enter().append("g")
    .attr("class", "fg-line");

    fgLines.append("path")
    .attr("class","foreground")
    .attr("d", path)
    .attr("fill","none")
    .attr("stroke", d => d.diff_percent < 0 ? "rgb(28, 64, 140)" : "rgb(191,29,41)")
    .attr("stroke-width",1)
    .attr("stroke-opacity",0.7)
    .classed("selected", false);

    fgLines.append("path")
    .attr("class", "hover-path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", 10)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
        svg.append("text")
        .attr("id", "hover-label")
        .attr("x", event.offsetX - margin.left + 10)
        .attr("y", event.offsetY - margin.top - 10)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text(d.id);
    })
    .on("mousemove", function(event) {
        svg.select("#hover-label")
        .attr("x", event.offsetX - margin.left + 10)
        .attr("y", event.offsetY - margin.top - 10);
    })
    .on("mouseout", function() {
        svg.select("#hover-label").remove();
    })
    .on("click", function(event, d) {
        const group = d3.select(this.parentNode);
        const isSelected = group.classed("selected");
        group.classed("selected", !isSelected);

        group.select(".foreground")
            .attr("stroke-width", isSelected ? 1 : 3)
            .attr("stroke", isSelected ? (d.diff_percent < 0 ? "rgb(28, 64, 140)" : "rgb(191,29,41)") : "black")
            .attr("stroke-opacity", isSelected ? 0.7 : 1);
    });

    // Add drag functionality to each dimension
    const drag = d3.drag()
        .on("start", function(event, d) {
            d3.select(this).raise().classed("active", true);
        })
        .on("drag", function(event, d) {
            d3.select(this).attr("transform", `translate(${event.x}, 0)`);
        })
        .on("end", function(event, d) {
            d3.select(this).classed("active", false);
            let positions = [];
            svg.selectAll(".dimension").each(function(dim) {
                var xVal = extractDimensionX(this)
                positions.push({
                    key: dim,
                    x: xVal
                });
            });
            positions.sort((a, b) => a.x - b.x);
            featuresOrdered = positions.map(d => d.key);
            x.domain(featuresOrdered);
            updateAxes(svg, x);
            redrawLines(svg, featuresOrdered, x, y);
            pcpFeatures.length = 0;
            featuresOrdered.forEach(f => pcpFeatures.push(f));
        });

    const axis = d3.axisLeft().ticks(5);
    const g = 
    svg.selectAll(".dimension")
        .data(featuresOrdered)
        .enter()
        .append("g")
        .attr("class","dimension")
        .attr("transform", dim => `translate(${x(dim)},0)`)
        .style("cursor", "pointer") 
        .call(drag);

    g.append("g")
    .each(function(dim) {
        const axisGen = d3.axisLeft(y[dim]).ticks(5);
        if (dim.includes("percent")) {
        axisGen.tickFormat(d => `${d}%`);
        }
        d3.select(this).call(axisGen);
    })
    .selectAll("text")
        .style("font-size", "12px");

    const dimMap = {'population':'Total Population', 'households_total':'Total Households', 'turnout_percent':'Turnout Rate', 'diff_percent':'Margin of Victory', 'households_median_income':'Median Household Income',
        'college_educated_percent':'Percentage College Educated', 'poverty_percent':'Percentage in Poverty', 'white_percent':'White Percentage', 'black_percent':'Black Percentage',
        'native_percent':'Native American Percentage', 'pacific_percent':'Pacific Islander Percentage', 'asian_percent':'Asian Percentage', 'other_percent':'Other Race Percentage',
        'hispanic_percent':'Hispanic Percentage'}

    // Add text to each dimension
    g.append("text")
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .each(function(dim) {
            const label = dimMap[dim] || dim;
            const words = label.split(" ");
            const wrapOneWord = showRace && (dim.includes("asian") || dim.includes("hispanic"));
            const lines = [];
            if (wrapOneWord) {
                for (let i = 0; i < words.length; i++) {
                    lines.push(words[i]);
                }
            } else {
                for (let i = 0; i < words.length; i += 2) {
                    lines.push(words.slice(i, i + 2).join(" "));
                }
            }
            const t = d3.select(this).text("");
            lines.forEach((line, i) => {
                t.append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? "0em" : "1.2em")
                    .text(line);
            });
        });

    var title = "Characteristics of All States";
    if (stateCode !== null){
        title = `Characteristics of Counties in ${data.codeToState[stateCode]} (${stateCode})`
    }

    svg.append("text")
        .attr("x", width/2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(title);
}

// Add transition effects to moving dimensions
function updateAxes(svg, x) {
    svg.selectAll(".dimension")
        .transition().duration(500)
        .attr("transform", d => `translate(${x(d)}, 0)`);
}

// Redraw lines if a dimension has been shifted
function redrawLines(svg, featuresOrdered, x, y) {
    const line = d3.line();
    svg.selectAll("path.foreground")
        .transition().duration(500)
        .attr("d", d => line(
            featuresOrdered.map(dim => {
                const val = dim === "diff_percent" ? Math.abs(d[dim]) : d[dim];
                return [x(dim), y[dim](val)];
            })
        ));
    svg.selectAll("path.background")
        .transition().duration(500)
        .attr("d", d => line(
            featuresOrdered.map(dim => {
                const val = dim === "diff_percent" ? Math.abs(d[dim]) : d[dim];
                return [x(dim), y[dim](val)];
            })
        ));
    svg.selectAll("path.hover-path")
        .transition().duration(500)
        .attr("d", d => line(
            featuresOrdered.map(dim => {
                const val = dim === "diff_percent" ? Math.abs(d[dim]) : d[dim];
                return [x(dim), y[dim](val)];
            })
        ));
}

function extractDimensionX(d){
    const transformAttr = d3.select(d).attr("transform");
    return transformAttr ? parseFloat(transformAttr.match(/translate\(([^,]+)/)[1]) : 0;
}
