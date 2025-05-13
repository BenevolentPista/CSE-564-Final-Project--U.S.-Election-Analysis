function drawPcpPlot(details, pcpFeatures, isState) {
    const data = [];
    if (isState){
        for (const [stateCode, values] of Object.entries(details)) {
            if(stateCode === "US"){
                continue;
            }

            const rec = { id: `${stateCode} (${stateCode})` };

            pcpFeatures.forEach(d => {
                if(values.hasOwnProperty(d)){
                    rec[d] = values[d];
                }
            })

            data.push(rec);
        }
    }
    else{
        for (const [stateCode, regions] of Object.entries(details)) {
            for (const [regionName, values] of Object.entries(regions)) {
                data.push({ id: `${regionName} (${stateCode})`, ...values });
            }
        }
    }

    if (!data.length) return;

    // 1) Numeric dimensions
    const dimensions = Object.keys(data[0])
    .filter(k => k !== "id" && typeof data[0][k] === "number");

    // 2) Order of axes
    const featuresOrdered = dimensions;

    // 3) Canvas
    const margin = { top: 70, right: 20, bottom: 10, left: 20 };
    const width  = 960 - margin.left - margin.right;
    const height = 420 - margin.top  - margin.bottom;

    d3.select("#pcpPlot").selectAll("*").remove();
    const svg = d3.select("#pcpPlot")
    .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4) Y-scales: special case per_point_diff → absolute
    const y = {};
    dimensions.forEach(dim => {
    if (dim === "diff_percent") {
        // only positive domain [0 .. max|diff|]
        y[dim] = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.abs(d[dim]))]).nice()
        .range([height, 0]);
    } else {
        y[dim] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dim])).nice()
        .range([height, 0]);
    }
    });

    // 5) X-scale
    const x = d3.scalePoint()
    .domain(featuresOrdered)
    .range([0, width])
    .padding(0.5);

    // 6) Line generator with abs() on per_point_diff
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

    // 7) Background lines (light grey)
    svg.selectAll("path.background")
    .data(data)
    .enter().append("path")
        .attr("class","background")
        .attr("d", path)
        .attr("fill","none")
        .attr("stroke","#eee")
        .attr("stroke-width",1);

    // 8) Foreground lines, colored by diff_percent sign
    svg.selectAll("path.foreground")
    .data(data)
    .enter().append("path")
        .attr("class","foreground")
        .attr("d", path)
        .attr("fill","none")
        .attr("stroke", d => d.diff_percent < 0 ? "rgb(28, 64, 140)" : "rgb(191,29,41)")
        .attr("stroke-width",1)
        .attr("stroke-opacity",0.7)
    .append("title")
        .text(d => `${d.id}\n` +
        featuresOrdered.map(dim => {
            const v = (dim === "diff_percent" ? Math.abs(d[dim]) : d[dim]).toFixed(2);
            return `${dim}: ${v}`;
        }).join("\n")
        );

    // 9) Axes per dimension
    const axis = d3.axisLeft().ticks(5);
    const g = svg.selectAll(".dimension")
    .data(featuresOrdered)
    .enter().append("g")
        .attr("class","dimension")
        .attr("transform", dim => `translate(${x(dim)},0)`);

    // Draw axis
    g.append("g")
    .each(function(dim) { d3.select(this).call(axis.scale(y[dim])); })
    .selectAll("text")
        .style("font-size","9px");

    // Dimension label
    const dimMap = {'population':'Total Population', 'turnout':'Turnout', 'diff_percent':'Margin of Victory', 'households_total':'Total Households', 'households_median_income':'Median Household Income', 'college_educated_percent':'Percentage College Educated', 'poverty_percent':'Percentage in Poverty'}

    // Dimension label with 2-word wrapping
    g.append("text")
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .each(function(dim) {
        const label = dimMap[dim] || dim;
        const words = label.split(" ");
        // group into lines of 2 words each
        const lines = [];
        for (let i = 0; i < words.length; i += 2) {
        lines.push(words.slice(i, i + 2).join(" "));
        }

        // clear any existing text
        const t = d3.select(this).text("");

        // one tspan per 2-word line
        lines.forEach((line, i) => {
        t.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? "0em" : "1.2em")
            .text(line);
        });
    });

    // 10) Title
    svg.append("text")
        .attr("x", width/2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Characteristics of All States");
}
