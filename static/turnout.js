function drawTurnoutPlot(turnoutPresident, dataHouse, dataSenate, dataPresidential) {
  // 1) Build data array for all three races
  const points = [];

  // — President points —
  Object.entries(dataPresidential)
    .filter(([st, v]) => turnoutPresident[st] && turnoutPresident[st].vep_turnout_rate)
    .forEach(([st, v]) => {
      const turnout = parseFloat(turnoutPresident[st].vep_turnout_rate.replace("%",""));
      const margin  = v.diff_percent;
      points.push({
        id: `${st}-pres-turnout`,
        type: "president",
        turnout,
        margin,
        absMargin: Math.abs(margin)
      });
    });

  // console.log("house data = ");
  // console.log(dataHouse);
  // // — House points (squares) —
  // Object.entries(dataHouse).forEach(([district, hr]) => {
  //   if (hr.house_turnout == null) return;
  //   const turnout = hr.house_turnout;
  //   const margin  = hr.margin;
  //   points.push({
  //     id: `${district}-turnout`,
  //     type: "house",
  //     turnout,
  //     margin,
  //     absMargin: Math.abs(margin)
  //   });
  // });

  // — Senate points (triangles) —
  Object.entries(dataSenate).forEach(([state, races]) => {
    if (state === "US"){
      return;
    }

    Object.entries(races).forEach(([cls, sr]) => {
      if (sr.senate_turnout == null) return;
      const turnout = sr.senate_turnout;
      const margin  = sr.margin;
      points.push({
        id: `${state}-(${cls})-turnout`,
        type:      "senate",
        turnout,
        margin,
        absMargin: Math.abs(margin)
      });
    });
  });

  console.log(points)

  // 2) Color scale (unchanged)
  const colorScale = margin => {
    const absM = Math.abs(margin), isDem = margin < 0;
    if (absM < 1)  return isDem ? "rgb(148,155,179)" : "rgb(207,137,128)";
    if (absM < 5)  return isDem ? "rgb(138,175,255)" : "rgb(255,139,152)";
    if (absM < 15) return isDem ? "rgb(87,124,204)"  : "rgb(255,88,101)";
                   return isDem ? "rgb(28,64,140)"   : "rgb(191,29,41)";
  };

  // 3) Margins & canvas
  const margin = { top: 30, right: 20, bottom: 60, left: 70 };
  const vbWidth  = 500;
  const vbHeight = 450;
  const width  = vbWidth  - margin.left - margin.right;
  const height = vbHeight - margin.top  - margin.bottom;

  // 4) Clear & create SVG
  d3.select("#turnoutPlot").selectAll("*").remove();
  const svg = d3.select("#turnoutPlot")
    .append("svg")
      .attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 5) Scales
  const x = d3.scaleLinear()
    .domain([
      d3.min(points, d => d.turnout) - 2,
      d3.max(points, d => d.turnout) + 2
    ])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(points, d => d.absMargin) + 5])
    .range([height, 0]);

  // 6) Axes
  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x).ticks(8).tickFormat(d => d + "%"));

  svg.append("g")
     .call(d3.axisLeft(y).ticks(8).tickFormat(d => d + "%"));

  // 7) Labels
  svg.append("text")
     .attr("x", width / 2)
     .attr("y", height + 45)
     .attr("text-anchor", "middle")
     .text("VEP Turnout Rate (%)");

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -50)
     .attr("x", -height / 2)
     .attr("text-anchor", "middle")
     .text("Margin of Victory (%)");

  // 8) Symbols
  const circleSym   = d3.symbol().type(d3.symbolCircle).size( 80 );
  const starSym     = d3.symbol().type(d3.symbolStar)  .size(200);
  const squareSym   = d3.symbol().type(d3.symbolSquare).size(100);
  const triangleSym = d3.symbol().type(d3.symbolTriangle).size(100);

  // 9) Draw all points
  svg.selectAll("path.point")
    .data(points)
    .enter()
    .append("path")
      .attr("class", "point")
      .attr("d", d => {
        if (d.type === "president")  return d.id === "US" ? starSym() : circleSym();
        if (d.type === "house")      return squareSym();
        /* else */                    return triangleSym();
      })
      .attr("transform", d => `translate(${x(d.turnout)},${y(d.absMargin)})`)
      .attr("fill",    d => colorScale(d.margin))
      // .attr("opacity", 0.8)
    .append("title")
      .text(d =>
        `${d.id}: turnout ${d.turnout.toFixed(1)}%, margin ${d.margin>0?"+":""}${d.margin.toFixed(1)}%`
      );

  // 10) Title
  svg.append("text")
     .attr("x", width/2)
     .attr("y", -10)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("font-weight", "bold")
     .text("Turnout Rate vs. Margin of Victory");
}
