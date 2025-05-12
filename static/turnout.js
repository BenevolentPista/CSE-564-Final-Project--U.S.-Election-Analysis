function drawTurnoutPlot(turnoutData, dataPresidential) {
  // 1) Build data array
  const points = Object.entries(dataPresidential)
    .filter(([st, v]) => turnoutData[st] && turnoutData[st].vep_turnout_rate)
    .map(([st, v]) => {
      const turnout = parseFloat(turnoutData[st].vep_turnout_rate.replace("%",""));
      const margin  = v.margin;
      return {
        state:     st,
        turnout,
        margin,
        absMargin: Math.abs(margin)
      };
    });

  // 2) Color scale (unchanged)
  const colorScale = margin => {
    const absM = Math.abs(margin), isDem = margin >= 0;
    if (absM < 1)  return isDem ? "rgb(148,155,179)" : "rgb(207,137,128)";
    if (absM < 5)  return isDem ? "rgb(138,175,255)" : "rgb(255,139,152)";
    if (absM < 15) return isDem ? "rgb(87,124,204)"  : "rgb(255,88,101)";
                   return isDem ? "rgb(28,64,140)"   : "rgb(191,29,41)";
  };

  // 3) Margins & virtual canvas (taller now)
  const margin = { top: 30, right: 20, bottom: 60, left: 70 };
  const vbWidth  = 500;
  const vbHeight = 450;       // ↑ extra vertical space
  const width  = vbWidth  - margin.left - margin.right;
  const height = vbHeight - margin.top  - margin.bottom;

  // 4) Clear & create responsive SVG
  d3.select("#turnoutPlot").selectAll("*").remove();
  const svg = d3.select("#turnoutPlot")
    .append("svg")
      .attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .classed("svg-content-responsive", true)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 5) Scales (flipped)
  const x = d3.scaleLinear()
    .domain([0, d3.max(points, d => d.absMargin) + 5])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(points, d => d.turnout) - 2,
      d3.max(points, d => d.turnout) + 2
    ])
    .range([height, 0]);

  // 6) Axes (flipped)
  const xAxis = d3.axisBottom(x)
    .ticks(8)
    .tickFormat(d => d + "%");
  const yAxis = d3.axisLeft(y)
    .ticks(8)
    .tickFormat(d => d + "%");

  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(xAxis);

  svg.append("g")
     .call(yAxis);

  // 7) Axis labels (swapped)
  svg.append("text")
     .attr("x", width / 2)
     .attr("y", height + 45)
     .attr("text-anchor", "middle")
     .text("Margin of Victory (%)");

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -50)
     .attr("x", -height / 2)
     .attr("text-anchor", "middle")
     .text("VEP Turnout Rate (%)");

  // 8) Symbol generators
  const circleSym = d3.symbol().type(d3.symbolCircle).size( 80 );
  const starSym   = d3.symbol().type(d3.symbolStar)  .size(200);

  // 9) Draw points at (margin, turnout)
  svg.selectAll("path.point")
    .data(points)
    .enter()
    .append("path")
      .attr("class", "point")
      .attr("d", d => d.state === "US" ? starSym() : circleSym())
      .attr("transform", d =>
        `translate(${x(d.absMargin)},${y(d.turnout)})`
      )
      .attr("fill",    d => colorScale(d.margin))
      .attr("opacity", 0.8)
    .append("title")
      .text(d =>
        `${d.state}: turnout ${d.turnout.toFixed(1)}%, ` +
        `margin ${d.margin>0?"+":""}${d.margin.toFixed(1)}%`
      );

  // 10) Title
  svg.append("text")
     .attr("x", width/2).attr("y", -10)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("font-weight", "bold")
     .text("Turnout Rate vs. Margin of Victory");
}
