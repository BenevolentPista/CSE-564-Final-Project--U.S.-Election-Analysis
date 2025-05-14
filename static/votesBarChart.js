function drawVotesBarChart(votes, codeToState, demPartyCandidate, repPartyCandidate, stateCode) {
  d3.select("#voteCounts").selectAll("*").remove();

  const data = votes[stateCode];
  if (!data) {
    console.warn(`No data for state: ${stateCode}`);
    return;
  }

  const chartData = [
    { party: demPartyCandidate, value: data["d_vote_percentage"], color: "rgb(28, 64, 140)" },
    { party: repPartyCandidate, value: data["r_vote_percentage"], color: "rgb(191, 29, 41)" },
    { party: "Others", value: data["others_vote_percentage"], color: "grey" }
  ];

  const margin = { top: 30, right: 20, bottom: 30, left: 80 },
        width = 900 - margin.left - margin.right,
        height = 170 - margin.top - margin.bottom;

  const svg = d3.select("#voteCounts")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand()
    .domain(chartData.map(d => d.party))
    .range([0, height])
    .padding(0.4);

  const maxDomain = d3.max(chartData, d => d.value);
  const x = d3.scaleLinear()
    .domain([0, Math.min(100, maxDomain + 10)])
    .nice()
    .range([0, width]);

  // Y Axis (parties)
  svg.append("g")
    .call(d3.axisLeft(y));

  // X Axis (percent)
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `${d}%`));

  // Bars
  svg.selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.party))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.value))
    .attr("fill", d => d.color);

  // Add labels at the end of bars
  svg.selectAll(".label")
    .data(chartData)
    .enter()
    .append("text")
    .attr("y", d => y(d.party) + y.bandwidth() / 2 + 4)
    .attr("x", d => x(d.value) + 5)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .attr("fill", "#000")
    .text(d => `${d.value.toFixed(1)}%`);

  const title = stateCode === "US"
    ? "Vote Percentage in the U.S"
    : `Vote Percentages in ${codeToState[stateCode]}`;

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(title);
}

function drawEvBarChart(dataPresidential, demPartyCandidate, repPartyCandidate, stateCode = null) {
  const votesByState = dataPresidential.votes;
  const evsByState   = dataPresidential.evs;

  // color scale
  const colorScale = (margin) => {
    const absMargin = Math.abs(margin), isDem = margin < 0;
    if (absMargin < 1)  return isDem ? "rgb(148,155,179)" : "rgb(207,137,128)";
    if (absMargin < 5)  return isDem ? "rgb(138,175,255)" : "rgb(255,139,152)";
    if (absMargin < 15) return isDem ? "rgb(87,124,204)"  : "rgb(255,88,101)";
                        return isDem ? "rgb(28,64,140)"   : "rgb(191,29,41)";
  };

  // build demSegments & repSegments
  const demSegments = [], repSegments = [];
  Object.entries(votesByState).forEach(([state, v]) => {
    if (state === "US") return;
    let evsD, evsR, mD, mR;
    if (state === "ME") {
      evsD = 3; evsR = 1; mD = v.diff_percent; mR = 9.04;
    } else if (state === "NE") {
      evsD = 1; evsR = 4; mD = -4.59;   mR = v.diff_percent;
    } else {
      evsD = evsByState[state].d_evs;
      evsR = evsByState[state].r_evs;
      mD = mR = v.diff_percent;
    }
    if (evsD > 0) demSegments.push({state, ev: evsD, diff_percent: mD});
    if (evsR > 0) repSegments.push({state, ev: evsR, diff_percent: mR});
  });

  demSegments.sort((a,b) => a.diff_percent - b.diff_percent);
  repSegments.sort((a,b) => b.diff_percent - a.diff_percent);
  let cum = 0;
  demSegments.forEach(d => { d.x0 = cum; cum += d.ev; });
  const totalDemEV = cum;
  cum = 0;
  repSegments.forEach(d => { d.x0 = cum; cum += d.ev; });
  const totalRepEV = cum;

  const margin = { top: 30, right: 20, bottom: 30, left: 80 };
  const width  = 900 - margin.left - margin.right;
  const height = 170 - margin.top  - margin.bottom;
  const barHeight = height / 4;

  // clear & svg
  d3.select("#evBarPlot").selectAll("*").remove();
  const svg = d3.select("#evBarPlot")
    .append("svg")
      .attr("width",  width + margin.left + margin.right)
      .attr("height", height + margin.top  + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale with 270 tick
  const x = d3.scaleLinear().domain([0, 350]).range([0, width]);
  let ticks = x.ticks(10);
  ticks.push(270);
  ticks = Array.from(new Set(ticks)).sort((a,b)=>a-b);
  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(ticks));

  // Y scale & wrapped labels
  const y = d3.scaleBand()
      .domain([demPartyCandidate, repPartyCandidate])
      .range([0, height])
      .paddingInner(0.4);

    // Y Axis (parties)
  svg.append("g")
    .call(d3.axisLeft(y));

  function drawSegments(segments, name) {
    const y0 = y(name);
    svg.selectAll(`.seg-${name}`)
      .data(segments)
      .enter().append("rect")
        .attr("class", `seg-${name}`)
        .attr("x", d => x(d.x0))
        .attr("y", y0 + 10)
        .attr("height", barHeight)
        .attr("width", d => x(d.ev))
        .attr("fill", d => {
          if (stateCode && d.state === stateCode) {
            return "rgb(255, 215, 0)";
          }
          return colorScale(d.diff_percent);
        })
        .attr("stroke", "none") // <-- No border by default
        .attr("stroke-width", 3)
        .attr("id", d => `${d.state}-bar`)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("stroke", "rgb(255, 215, 0)")
            .attr("stroke-width", 3);
        })
        .on("mouseout", function(event, d) {
          const bar = d3.select(this);
          if (!bar.classed("selected")) {
            bar.attr("stroke", "none");
          }
        })
        .on("click", function(event, d) {
          const bar = d3.select(this);
          const wasSelected = bar.classed("selected");

          // Deselect all
          svg.selectAll("rect")
            .classed("selected", false)
            .attr("fill", b => colorScale(b.diff_percent))
            .attr("stroke", "none");

          if (!wasSelected) {
            bar.classed("selected", true)
              .attr("fill", "rgb(255, 215, 0)")
              .attr("stroke", "rgb(255, 215, 0)")
              .attr("stroke-width", 3);

            const code = d.state;
            const mapElem = code === "DC" ? d3.select("#dc-circle") : d3.select(`#state-${code}`);
            if (!mapElem.empty()) {
              mapElem.node().dispatchEvent(new Event("click"));
            }
          }
        })
        .append("title")
        .text(d => `${d.state}: ${d.ev} EVs, margin ${d.diff_percent > 0 ? "+" : ""}${d.diff_percent}%`);
  }

  drawSegments(demSegments, demPartyCandidate);
  drawSegments(repSegments, repPartyCandidate);

  svg.append("line")
    .attr("x1", x(270)).attr("y1", 0)
    .attr("x2", x(270)).attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-dasharray", "4 4");

  svg.append("text")
      .attr("x", x(totalDemEV)+5)
      .attr("y", y(demPartyCandidate) + barHeight/2 + 15)
      .text(totalDemEV).style("font-weight","bold");

  svg.append("text")
      .attr("x", x(totalRepEV)+5)
      .attr("y", y(repPartyCandidate) + barHeight/2 + 15)
      .text(totalRepEV).style("font-weight","bold");

  svg.append("text")
      .attr("x", width/2).attr("y", -10)
      .attr("text-anchor","middle")
      .style("font-size","16px").style("font-weight","bold")
      .text("Electoral vote distribution");
}
