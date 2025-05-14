function drawSplitVotingPlot(presidentCdLevelResults, presidentStateLevelResults, houseResults, senateResults, stateCode = null) {
  // 0) helper for quadrant coloring
  function quadrantColor(d) {
    if (d.x < 0 && d.y < 0) {
      // Dem at both levels
      return "rgb(28,64,140)";
    } else if (d.x > 0 && d.y > 0) {
      // Rep at both levels
      return "rgb(191,29,41)";
    } else {
      // split — Dem pres & Rep lower or vice versa
      return "rgb(170, 90, 200)";  // a nice purple
    }
  }

  // 1) Build a unified data array
  const dataPoints = [];

  // — House points —
  if (stateCode !== null){
    console.log("Check house results")
    console.log(houseResults)
    console.log("Check president results by CD")
    console.log(presidentCdLevelResults)
    Object.entries(houseResults).forEach(([district, hr]) => {
      if(district.includes(stateCode)){
        const pr = presidentCdLevelResults[district];
        if (!pr) return;
        const x = pr.margin;              // pres margin
        const y = hr.margin;
        dataPoints.push({
          id: `${district}-cmp`,
          entity: district,
          type: "house",
          x,
          y
        });
      }
    });
  }

  // — Senate points —
  Object.entries(senateResults).forEach(([state, races]) => {
    if (state === "US" || ((stateCode !== null) && (state !== stateCode))){
      return;
    }

    const pr = presidentStateLevelResults[state];
    if (!pr) return;
    Object.entries(races).forEach(([cls, sr]) => {
      const sign = (sr.party1.ballot_party === "DEM" || sr.party1.ballot_party === "IND") ? -1 : 1;
      const x = pr.diff_percent;
      const y = sr.margin;

      dataPoints.push({
        id: `${state}-(${cls})-cmp`,
        entity: `${state}-(${cls})`,
        type: "senate",
        x,
        y
      });
    });
  });

  // 2) Setup SVG canvas
  const margin = { top: 40, right: 20, bottom: 60, left: 70 };
  const vbW = 500, vbH = 450;
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

  // 3) Scales, padded
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

  // 5) Quadrant lines
  svg.append("line")
     .attr("x1", x(0)).attr("y1", 0)
     .attr("x2", x(0)).attr("y2", height)
     .attr("stroke", "#666");

  svg.append("line")
     .attr("x1", 0).attr("y1", y(0))
     .attr("x2", width).attr("y2", y(0))
     .attr("stroke", "#666");

  // 6) Symbols
  const symSquare   = d3.symbol().type(d3.symbolSquare).size(110);
  const symTriangle = d3.symbol().type(d3.symbolTriangle).size(110);

  // 7) Draw points with quadrant‐based fill + borders + interactivity
  const pointSel = svg.selectAll("path.point")
    .data(dataPoints)
    .enter()
    .append("path")
      .attr("class", "point")
      .attr("d", d => d.type === "house" ? symSquare() : symTriangle())
      .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
      .attr("fill",    d => quadrantColor(d))
      .attr("stroke",  "rgb(136,136,136)")
      .attr("id", d => d.id)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 3);
        d3.select(this).attr("stroke", "rgb(8, 245, 0)");
      })
      .on("mouseout", function(event, d) {
        // only reset if not clicked/selected
        if (!d3.select(this).classed("selected")) {
          d3.select(this).attr("stroke-width", 1);
          d3.select(this).attr("stroke", "rgb(136,136,136)");
        }
      })
      .on("click", function(event, d) {
        const sel = d3.select(this);
        const wasSelected = sel.classed("selected");
        sel.classed("selected", !wasSelected)
           .attr("stroke-width", wasSelected ? 1 : 3)
           .attr("stroke", wasSelected ? "rgb(136,136,136)" : "rgb(8, 245, 0)");

        // Remove old label if it exists
        svg.select(`#${CSS.escape("label-" + d.id)}`).remove();
        if (!wasSelected) {
          // Add the label to splitVotingPlot
          console.log("Add the label to splitVotingPlot");
          svg.append("text")
            .attr("id", `label-${d.id}`)
            .attr("x", x(d.x) + 8)
            .attr("y", y(d.y) + 14)
            .attr("font-size", "15px")
            .attr("fill", "black")
            .text(counter);
          counter++;
        }
        else {
          // Remove the label in splitVotingPlot
          console.log("Remove the label in splitVotingPlot");
          svg.select(`#${CSS.escape("label-" + d.id)}`).remove();
        }
        
        // Select the corresponding id in turnout
        const otherId = d.id.replace(/-cmp$/, "-turnout");
        const other = d3.select(`#turnoutPlot [id="${otherId}"]`);
        const otherSvg = d3.select("#turnoutPlot svg g");
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
              .attr("x", otherx + 8) // reuse turnout as x
              .attr("y", othery + 14) // reuse absMargin as y
              .attr("font-size", "15px")
              .attr("fill", "black")
              .text(counter - 1); // same number as current selection
          }
        }
      });

  // re‐attach tooltips
  pointSel.append("title")
    .text(d =>
      `${d.entity}\nPresident margin: ${d.x.toFixed(1)}%\n` +
      `${d.type === "house" ? "House" : "Senate"} margin: ${d.y.toFixed(1)}%`
    );

  // 8) Color legend rectangles with tooltip
  const legendItems = [
    { color: "rgb(28, 64, 140)", tooltip: "District/State voted Democratic at the presidential level and district/senate level" },
    { color: "rgb(191, 29, 41)", tooltip: "District/State voted Republican at the presidential level and district/senate level" },
    { color: "rgb(170, 90, 200)", tooltip: "District/State voted for different parties at the senate/district level and the presidential level" }
  ];

  const legendGroup = svg.append("g")
    .attr("transform", `translate(0, ${height + 30})`);

  legendGroup.selectAll("rect.legend-color")
    .data(legendItems)
    .enter()
    .append("rect")
    .attr("class", "legend-color")
    .attr("x", (d, i) => i * 40)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => d.color)
    .attr("stroke", "#333")
    .attr("rx", 3)
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .text(d.tooltip);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", (event.pageY + 12) + "px")
        .style("left", (event.pageX + 12) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // 9) Axis labels
  svg.append("text")
    .attr("x", width/2).attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("President margin (%)")
    .style("font-size", "16px");

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -50).attr("x", -height/2)
     .attr("text-anchor", "middle")
     .text("House/Senate margin (%)")
     .style("font-size", "16px");

  // 10) Title
  svg.append("text")
     .attr("x", width/2).attr("y", -20)
     .attr("text-anchor", "middle")
     .style("font-size","16px")
     .style("font-weight","bold")
     .text("Split‐Voting: President vs. House/Senate Margins");
}
