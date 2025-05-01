function drawBarChart(votes, codeToState, stateCode, demPartyCandidate, repPartyCandidate) {
    // Clear any previous chart
    d3.select("#voteCounts").selectAll("*").remove();
  
    const data = votes[stateCode];
    if (!data) {
      console.warn(`No data for state: ${stateCode}`);
      return;
    }
  
    console.log(demPartyCandidate)
    console.log(repPartyCandidate)
    const chartData = [
      { party: demPartyCandidate, value: data["D Vote Percentage"], color: "rgb(28, 64, 140)" },
      { party: repPartyCandidate, value: data["R Vote Percentage"], color: "rgb(191, 29, 41)" },
      { party: "Others", value: data["Others Vote Percentage"], color: "grey" }
    ];
  
    const margin = { top: 40, right: 20, bottom: 50, left: 50 },
          width = 400 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;
  
    const svg = d3.select("#voteCounts")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleBand()
      .domain(chartData.map(d => d.party))
      .range([0, width])
      .padding(0.4);
  
    const maxDomain = d3.max([
        data["D Vote Percentage"],
        data["R Vote Percentage"],
        data["Others Vote Percentage"]
      ]);      
    const y = d3.scaleLinear()
      .domain([0, d3.min([100, maxDomain+10])])
      .nice()
      .range([height, 0]);
      
    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`));
  
    // Bars
    svg.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.party))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => d.color);
  
    // Add labels on top of bars
    svg.selectAll(".label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("x", d => x(d.party) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#000")
      .text(d => `${d.value.toFixed(1)}%`);

    var title;
    if (stateCode === "US"){
      title = "Vote Percentage in the U.S"  
    }
    else{
      title = `Vote Percentages in ${codeToState[stateCode]}`
    }

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(title);
  }
  