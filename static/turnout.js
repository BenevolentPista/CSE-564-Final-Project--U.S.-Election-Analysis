// Function that draws the turnout of a race against the margin of victory in that state
function drawTurnoutPlot(turnoutPresident, dataHouse, dataSenate, dataPresidential, stateCode = null) {
  // 1) Build data array for all three races
  const points = [];

  // — President points —
  Object.entries(dataPresidential)
    .filter(([st, v]) => turnoutPresident[st] && turnoutPresident[st].vep_turnout_rate)
    .forEach(([st, v]) => {
      if ((stateCode !== null) && (st !== stateCode) && (st !== "US")) {
        return;
      }

      const turnout = parseFloat(turnoutPresident[st].vep_turnout_rate.replace("%",""));
      const margin  = v.diff_percent;
      points.push({
        id: `${st}-pres-turnout`,
        entity: st,
        type: "president",
        turnout,
        margin,
        absMargin: Math.abs(margin)
      });
    });

  // — House points (squares) —
  if (stateCode !== null){
    Object.entries(dataHouse).forEach(([district, hr]) => {
      if(district.includes(stateCode)){
        if (hr.house_turnout == null) return;
        const turnout = hr.house_turnout;
        const margin  = hr.margin;
        points.push({
          id: `${district}-turnout`,
          entity: district,
          type: "house",
          turnout,
          margin,
          absMargin: Math.abs(margin)
        });
      }
    });
  }

  // — Senate points (triangles) —
  Object.entries(dataSenate).forEach(([state, races]) => {
    if (state === "US" || ((stateCode !== null) && (state !== stateCode))){
      return;
    }

    Object.entries(races).forEach(([cls, sr]) => {
      if (sr.senate_turnout == null) return;
      const turnout = sr.senate_turnout;
      const margin  = sr.margin;
      points.push({
        id: `${state}-(${cls})-turnout`,
        type: "senate",
        entity: `${state}-(${cls})`,
        turnout,
        margin,
        absMargin: Math.abs(margin)
      });
    });
  });

  console.log(points)

  // 2) Color scale
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
  const vbHeight = 435;
  const width  = vbWidth  - margin.left - margin.right;
  const height = vbHeight - margin.top  - margin.bottom;

  // 4) Clear & create SVG
  d3.select("#turnoutPlot").selectAll("*").remove();
  const svg = d3.select("#turnoutPlot")
    .append("svg")
      .attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("width","100%").style("height","100%")
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
     .attr("y", height + 40)
     .attr("text-anchor", "middle")
     .text("Turnout Rate (%)");

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -50)
     .attr("x", -height / 2)
     .attr("text-anchor", "middle")
     .text("Margin of Victory (%)");

  // 8) Symbols
  const circleSym   = d3.symbol().type(d3.symbolCircle).size( 110 );
  const starSym     = d3.symbol().type(d3.symbolStar)  .size(200);
  const squareSym   = d3.symbol().type(d3.symbolSquare).size(110);
  const triangleSym = d3.symbol().type(d3.symbolTriangle).size(110);

  // 9) Draw all points with hover+click interactivity
  const pointSel = svg.selectAll("path.point")
    .data(points)
    .enter()
    .append("path")
      .attr("class", "point")
      .attr("d", d => {
        if (d.type === "president"){
          // console.log(d.id);
          // if (d.id === "US-pr"){
          //   console.log(`id = ${d.id}`)
          // }
          return d.id === "US-pres-turnout" ? starSym() : circleSym();
        }
        if (d.type === "house")      return squareSym();
        return triangleSym();
      })
      .attr("transform", d => `translate(${x(d.turnout)},${y(d.absMargin)})`)
      .attr("fill",    d => colorScale(d.margin))
      .attr("stroke",  "rgb(136,136,136)")
      .attr("id", d => d.id)
      .attr("stroke-width", 1)
      .style("cursor", d => d.type === "president" ? "default" : "pointer")
      // When hovering over a point, change the point border to green to indicate so
      .on("mouseover", function(event, d) {
        if (d.type === "president") return;
        d3.select(this).attr("stroke-width", 3);
        d3.select(this).attr("stroke", "rgb(8, 245, 0)");
      })
      // Remove the color of highlight after hovering out of a point
      .on("mouseout", function(event, d) {
        if (d.id === "US-pres-turnout") return;
        if (!d3.select(this).classed("selected")) {
          d3.select(this).attr("stroke-width", 1);
          d3.select(this).attr("stroke", "rgb(136,136,136)");
        }
      })
      // Highlight the point if clicked on. Reset the color if it is clicked again
      .on("click", function(event, d) {
        if (d.id === "US-pres-turnout") return;
        const sel = d3.select(this);
        const wasSelected = sel.classed("selected");
        sel.classed("selected", !wasSelected)
          .attr("stroke-width", wasSelected ? 1 : 3)
          .attr("stroke", wasSelected ? "rgb(136,136,136)" : "rgb(8, 245, 0)");

        svg.select(`#${CSS.escape("label-" + d.id)}`).remove();
        if (!wasSelected) {
          svg.append("text")
            .attr("id", `label-${d.id}`)
            .attr("x", x(d.turnout) + 8)
            .attr("y", y(d.absMargin) + 14)
            .attr("font-size", "15px")
            .attr("fill", "black")
            .text(counter);
          counter++;
        }

        const otherId = d.id.replace(/-turnout$/, "-cmp");
        const other = d3.select(`#splitVotingPlot [id="${otherId}"]`);
        const otherSvg = d3.select("#splitVotingPlot svg g");
        const otherElement = d3.select(`#${CSS.escape(otherId)}`);
        const transform = otherElement.attr("transform");
        const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
        var otherx, othery;
        if (match) {
          otherx = parseFloat(match[1]);
          othery = parseFloat(match[2]);
        }

        if (!other.empty()) {
          other.classed("selected", !wasSelected)
              .attr("stroke-width", wasSelected ? 1 : 3)
              .attr("stroke", wasSelected ? "rgb(136,136,136)" : "rgb(8, 245, 0)");

          otherSvg.select(`#${CSS.escape("label-" + otherId)}`).remove();
          if (!wasSelected) {
            otherSvg.append("text")
              .attr("id", `label-${otherId}`)
              .attr("x", otherx + 8)
              .attr("y", othery + 14)
              .attr("font-size", "15px")
              .attr("fill", "black")
              .text(counter - 1);
          }
        }
      });

  // finally add tooltips
  pointSel.append("title")
    .text(d =>
      `${d.entity}:\nTurnout ${d.turnout.toFixed(1)}%,\nMargin ${Math.abs(d.margin.toFixed(1))}%`
    );

  svg.select("#US-pres-turnout")
   .style("cursor", "default");

  // 10) Title
  svg.append("text")
     .attr("x", width/2)
     .attr("y", -10)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("font-weight", "bold")
     .text("Turnout Rate vs. Margin of Victory");
}
