function drawPcpPlot(countyDetails) {
  // 0) Flatten into one record per region
  const data = [];
  for (const [stateCode, regions] of Object.entries(countyDetails)) {
    for (const [regionName, values] of Object.entries(regions)) {
      data.push({ id: `${regionName} (${stateCode})`, ...values });
    }
  }
  if (!data.length) return;

  // 1) Numeric dimensions
  const dimensions = Object.keys(data[0])
    .filter(k => k !== "id" && typeof data[0][k] === "number");

  // 2) Order of axes
  const featuresOrdered = dimensions;

  // 3) Canvas
  const margin = { top: 70, right: 20, bottom: 20, left: 20 };
  const width  = 800 - margin.left - margin.right;
  const height = 400 - margin.top  - margin.bottom;

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
    if (dim === "per_point_diff") {
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
        const val = dim === "per_point_diff" ? Math.abs(raw) : raw;
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

  // 8) Foreground lines, colored by per_point_diff sign
  svg.selectAll("path.foreground")
    .data(data)
    .enter().append("path")
      .attr("class","foreground")
      .attr("d", path)
      .attr("fill","none")
      .attr("stroke", d => d.per_point_diff < 0 ? "steelblue" : "rgb(191,29,41)")
      .attr("stroke-width",1)
      .attr("stroke-opacity",0.7)
    .append("title")
      .text(d => `${d.id}\n` +
        featuresOrdered.map(dim => {
          const v = (dim === "per_point_diff" ? Math.abs(d[dim]) : d[dim]).toFixed(2);
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

  // 9a) draw axis
  g.append("g")
    .each(function(dim) { d3.select(this).call(axis.scale(y[dim])); })
    .selectAll("text")
      .style("font-size","9px");

  // 9b) dimension label
  g.append("text")
    .attr("y",-15)
    .attr("text-anchor","middle")
    .style("font-size","11px")
    .text(dim => dim);
}
