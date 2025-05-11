function drawBarChart(votes, codeToState, stateCode, demPartyCandidate, repPartyCandidate) {
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
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

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
