function drawSplitVotingPlot(presidentCdLevelResults, presidentStateLevelResults, houseResults, senateResults) {
  // Store all data points (house vs pres, and senate vs pres)
  const dataPoints = [];

  // House results
  console.log(houseResults);
  console.log(presidentCdLevelResults);
  Object.entries(houseResults).forEach(([district, hr]) => {
    const pr = presidentCdLevelResults[district];
    if (!pr) return;  // no matching pres-CD result
    const x = pr.margin;      // negative = R win, positive = D win
    const sign = (hr.party_1 === "R") ? -1 : 1;
    const y = hr.margin * sign;      // same convention
    dataPoints.push({ id: district, type: "house", x, y });
  });

  // Senate results
  console.log(senateResults);
  console.log(presidentStateLevelResults);
  Object.entries(senateResults).forEach(([state, races]) => {
    const pr = presidentStateLevelResults[state];
    if (!pr) return;
    Object.entries(races).forEach(([cls, sr]) => {
      // sr.margin is always positive, sr.party1.ballot_party tells winner
      const sign = (sr.party1.ballot_party === "DEM" || sr.party1.ballot_party === "IND") ? 1 : -1;
      const x = pr.margin;
      const y = sr.margin * sign;

      dataPoints.push({
        id: `${state} (${cls})`,
        type: "senate",
        x, y
      });
    });
  });

  // 2) Setup SVG canvas
  const margin = { top: 40, right: 20, bottom: 40, left: 70 };
  const vbW = 500, vbH = 500;
  const width  = vbW  - margin.left - margin.right;
  const height = vbH  - margin.top  - margin.bottom;

  d3.select("#splitVotingPlot").selectAll("*").remove();
  const svg = d3.select("#splitVotingPlot")
    .append("svg")
      .attr("viewBox", `0 0 ${vbW} ${vbH}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("width","100%").style("height","100%")
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3) Scales, domain padded a bit
  const xExtent = d3.extent(dataPoints, d=>d.x);
  const yExtent = d3.extent(dataPoints, d=>d.y);
  const xPad = (xExtent[1] - xExtent[0]) * 0.1;
  const yPad = (yExtent[1] - yExtent[0]) * 0.1;

  const x = d3.scaleLinear()
      .domain([xExtent[0] - xPad, xExtent[1] + xPad])
      .range([0, width]);

  const y = d3.scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .range([height, 0]);

  // 4) Axes
  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x).ticks(8).tickFormat(d => d + "%"));

  svg.append("g")
     .call(d3.axisLeft(y).ticks(8).tickFormat(d => d + "%"));

  // 5) Quadrant lines at 0
  svg.append("line")
     .attr("x1", x(0)).attr("y1", 0)
     .attr("x2", x(0)).attr("y2", height)
     .attr("stroke", "#666");

  svg.append("line")
     .attr("x1", 0).attr("y1", y(0))
     .attr("x2", width).attr("y2", y(0))
     .attr("stroke", "#666");

  // 6) Symbols: square for house, triangle for senate
  const symSquare   = d3.symbol().type(d3.symbolSquare).size(100);
  const symTriangle = d3.symbol().type(d3.symbolTriangle).size(100);

  svg.selectAll("path.point")
    .data(dataPoints)
    .enter()
    .append("path")
      .attr("class", "point")
      .attr("d", d => d.type === "house" ? symSquare() : symTriangle())
      .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
      .attr("fill", d => d.type === "house" ? "steelblue" : "darkorange")
      .attr("opacity", 0.8)
    .append("title")
      .text(d => `${d.id}\nPresident margin: ${d.x.toFixed(1)}%\n${d.type === "house" ? "House" : "Senate"} margin: ${d.y.toFixed(1)}%`);

  // 7) Axis labels
  svg.append("text")
     .attr("x", width/2).attr("y", height + 35)
     .attr("text-anchor", "middle")
     .text("President margin (%)");

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -40).attr("x", -height/2)
     .attr("text-anchor", "middle")
     .text("House/Senate margin (%)");

  // 8) Title
  svg.append("text")
     .attr("x", width/2).attr("y", -10)
     .attr("text-anchor", "middle")
     .style("font-size","16px")
     .style("font-weight","bold")
     .text("Split-Voting: President vs. House/Senate Margins");
}
