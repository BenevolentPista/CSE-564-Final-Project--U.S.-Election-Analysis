// Function that draws a map of the U.S.
function drawUsaMap(votes, codeToState, fipsToState, demPartyCandidate, repPartyCandidate) {
    console.log("Data = ");
    console.log(data)
    console.log("votes = ")
    console.log(votes)

    const smallStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC", "HI"];
    const width = 960, height = 600;

    // Colors for the margins of victory
    const colorScale = (margin) => {
      const absMargin = Math.abs(margin);
      const isDem = margin < 0;
      if (absMargin < 1) return isDem ? "rgb(148, 155, 179)" : "rgb(207, 137, 128)";
      if (absMargin < 5) return isDem ? "rgb(138, 175, 255)" : "rgb(255, 139, 152)";
      if (absMargin < 15) return isDem ? "rgb(87, 124, 204)" : "rgb(255, 88, 101)";
      return isDem ? "rgb(28, 64, 140)" : "rgb(191, 29, 41)";
    };
  
    // Setting the size of the map
    const svg = d3.select("#geoMapUSA")
      .append("svg")
      .attr("viewBox", `50 -17 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "100%");

    // Add top labels for candidates
    const labelGroup = svg.append("g")
    .attr("class", "candidate-labels")
    .attr("transform", `translate(${width / 2 - 200}, 10)`);

    const demLabels = ["Safe Democratic result where margin of victory was >= 15%", "Likely Democratic result where margin of victory was >= 5% and < 15%", "Lean Democratic result where margin of victory was >= 1% and < 5%", "Tilt Democratic result where margin of victory was < 1%"];
    const repLabels = ["Safe Republican result where margin of victory was >= 15%", "Likely Republican result where margin of victory was >= 5% and < 15%", "Lean Republican result where margin of victory was >= 1% and < 5%", "Tilt Republican result where margin of victory was < 1%"];
    
    // Democratic candidate label
    const demGroup = labelGroup.append("g").attr("transform", `translate(80, 0)`);

    // Rectangular panel for Democratic candidate
    demGroup.append("rect")
    .attr("width", 180)
    .attr("height", 30)
    .attr("fill", "rgb(28, 64, 140)")
    .attr("rx", 6);

    // Text for Democratic candidate
    demGroup.append("text")
    .text(`${demPartyCandidate} 226`)
    .attr("x", 90)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#fff")
    .attr("font-weight", "bold");

    // Democratic color strip
    const demColors = [
    "rgb(28, 64, 140)",   // Safe
    "rgb(87, 124, 204)",  // Likely
    "rgb(138, 175, 255)", // Lean
    "rgb(148, 155, 179)"  // Tilt
    ];

    // Democratic Candidate: Options for hovering over each color
    demGroup.selectAll("rect.color")
    .data(demColors)
    .enter()
    .append("rect")
    .attr("x", (d, i) => 10 + i * 40)
    .attr("y", 35)
    .attr("width", 30)
    .attr("height", 10)
    .attr("fill", d => d)
    .attr("rx", 2)
    .on("mouseover", (event, d, i) => {
        const index = demColors.indexOf(d);
        tooltip
            .style("visibility", "visible")
            .text(demLabels[index]);
    })
    .on("mousemove", (event) => {
    tooltip
        .style("top", (event.pageY + 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
    tooltip.style("visibility", "hidden");
    });

    // Republican candidate label
    const repGroup = labelGroup.append("g").attr("transform", `translate(300, 0)`);

    // Rectangular panel for Republican candidate
    repGroup.append("rect")
    .attr("width", 180)
    .attr("height", 30)
    .attr("fill", "rgb(191, 29, 41)")
    .attr("rx", 6);

    // Text for Republican candidate
    repGroup.append("text")
    .text(`${repPartyCandidate} 312`)
    .attr("x", 90)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#fff")
    .attr("font-weight", "bold");

    // Republican color strip
    const repColors = [
    "rgb(191, 29, 41)",   // Safe
    "rgb(255, 88, 101)",  // Likely
    "rgb(255, 139, 152)", // Lean
    "rgb(207, 137, 128)"  // Tilt
    ];

    // Republican Candidate: Options for hovering over each color
    repGroup.selectAll("rect.color")
    .data(repColors)
    .enter()
    .append("rect")
    .attr("x", (d, i) => 10 + i * 40)
    .attr("y", 35)
    .attr("width", 30)
    .attr("height", 10)
    .attr("fill", d => d)
    .attr("rx", 2)
    .on("mouseover", (event, d) => {
    const index = repColors.indexOf(d);
    tooltip
        .style("visibility", "visible")
        .text(repLabels[index]);
    })
    .on("mousemove", (event) => {
    tooltip
        .style("top", (event.pageY + 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
    tooltip.style("visibility", "hidden");
    });

    function calculateStateCode(d) {
      return fipsToState[d.id.toString().padStart(2, "0")];
    }
  
    // Draw the map
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
      const states = topojson.feature(us, us.objects.states).features;
      const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "FeatureCollection", features: states });
      const path = d3.geoPath().projection(projection);
  
      // Draw states
      svg.selectAll("path.state")
        .data(states)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("id", d => `state-${fipsToState[d.id.toString().padStart(2, "0")]}`)
        .attr("fill", d => {
          const fips = d.id.toString().padStart(2, "0"),
                code = fipsToState[fips],
                vd = votes[code];
          return vd ? colorScale(parseFloat(vd.diff_percent)) : "#ccc";
        })
        .attr("stroke", "#fff") // White border for each state
        .attr("stroke-width", 1)
        .attr("cursor", "pointer")
        .on("mouseover", function(event, d) {
          if (!d3.select(this).classed("selected")) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
            const code = fipsToState[d.id.toString().padStart(2, "0")];
            d3.select(`#sidebar-${code}`)
              .attr("stroke", "#000")
              .attr("stroke-width", 3);
          }
        })
        .on("mouseout", function(event, d) {
          if (!d3.select(this).classed("selected")) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
            const code = fipsToState[d.id.toString().padStart(2, "0")];
            d3.select(`#sidebar-${code}`)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1);
          }
        })
        .on("click", function(event, d) {
          const fips = d.id.toString().padStart(2, "0"),
          code = fipsToState[fips],
          me = d3.select(this),
          was = me.classed("selected");

          // clear all selection
          svg.selectAll("path.state").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);
          d3.selectAll("rect.sidebar-rect").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);

          if (!was) {
            // Increase thickness of state border to indicate that it is selected
            me.classed("selected", true).attr("stroke", "#000").attr("stroke-width", 4);

            // If small state, make sure sidebar representation is also selected
            d3.select(`#sidebar-${code}`)
              .classed("selected", true)
              .attr("stroke", "#000")
              .attr("stroke-width", 4);

            // Update all plots for the level of the selected state
            updatePlots(code);
          } else {
            // State deselected
            resetPlots();
          }
        });

        // Add a dot for DC since it's hard to see
        const dcFeature = states.find(d => fipsToState[d.id.toString().padStart(2, "0")] === "DC");

        if (dcFeature) {
            const centroid = path.centroid(dcFeature);
            const dcCode = "DC";
            const dcData = votes[dcCode];
            const margin = parseFloat(dcData["diff_percent"]);
            const color = colorScale(margin);

            svg.append("circle")
                .attr("cx", centroid[0])
                .attr("cy", centroid[1])
                .attr("r", 6)
                .attr("fill", color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .attr("cursor", "pointer")
                .attr("id", "dc-circle")
                .on("mouseover", function(event) {
                  if (!d3.select(this).classed("selected")) {
                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
                    d3.select(`#sidebar-DC`).attr("stroke", "#000").attr("stroke-width", 3);
                  }
                })
                .on("mouseout", function() {
                  if (!d3.select(this).classed("selected")) {
                    d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
                    d3.select(`#sidebar-DC`).attr("stroke", "#fff").attr("stroke-width", 1);
                  }
                })
                .on("click", function() {
                  const me = d3.select(this),
                        was = me.classed("selected");

                  svg.selectAll("path.state").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);
                  d3.select("#dc-circle").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1.5);
                  d3.selectAll("rect.sidebar-rect").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);

                  if (!was) {
                    me.classed("selected", true).attr("stroke", "#000").attr("stroke-width", 4);
                    d3.select(`#sidebar-DC`)
                      .classed("selected", true)
                      .attr("stroke", "#000")
                      .attr("stroke-width", 4);
                    updatePlots("DC");
                  } else {
                    resetPlots();
                  }
                });
        }

      // Add labels for large states
      const largeStateGroups = svg.selectAll("g.state-label")
        .data(states.filter(d => {
          const code = fipsToState[d.id.toString().padStart(2, "0")];
          return !smallStates.includes(code);
        }))
        .join("g")
        .attr("class", "state-label")
        .attr("transform", d => {
            const centroid = path.centroid(d);
            if (isNaN(centroid[0]) || isNaN(centroid[1])) return null;
            
            const code = fipsToState[d.id.toString().padStart(2, "0")];
            let [x, y] = centroid;
            
            // Adjustments for MI and FL since they don't fit in properly in the state
            if (code === "MI") {
                x += 10;
                y += 10;
            } else if (code === "FL") {
                x += 15;
                y += 15;
            }
            
            return `translate(${x}, ${y})`;
        });          
  
      // Add state abbreviation
      largeStateGroups.append("text")
        .text(d => fipsToState[d.id.toString().padStart(2, "0")] || "")
        .attr("y", -4)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none");

      // Add electoral vote count in each state
      largeStateGroups.append("text")
        .text(d => {
          const code = fipsToState[d.id.toString().padStart(2, "0")];
          const voteData = votes[code];
          return voteData ? voteData["evs"] : "";
        })
        .attr("y", 9)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none");
  
      // Add sidebar labels for small states
      const sidebar = svg.append("g")
        .attr("class", "sidebar-labels")
        .attr("transform", `translate(${width - 100}, 50)`);
  
      // Update sidebar for all small states to contain relevant details
      smallStates.forEach((code, i) => {
        const y = 200 + i * 35;
        const voteData = votes[code];
        const margin = parseFloat(voteData["diff_percent"]);
        const fillColor = colorScale(margin);
        const electoralVotes = voteData ? voteData["evs"] : "";

        // Background rectangle
        sidebar.append("rect")
          .attr("class", "sidebar-rect")
          .attr("id", `sidebar-${code}`)
          .attr("x", 55)
          .attr("y", y-34)
          .attr("width", 40)
          .attr("height", height/20)
          .attr("rx", 4)
          .attr("fill", fillColor)
          .attr("stroke", "#fff")           // initial border
          .attr("stroke-width", 1)         // initial border width
          .attr("cursor", "pointer")
          .on("mouseover", () => {
            if (!d3.select(`#sidebar-${code}`).classed("selected")) {
              d3.select(`#sidebar-${code}`).attr("stroke", "#000").attr("stroke-width", 3);
              d3.select(`#state-${code}`)
                .attr("stroke", "#000")
                .attr("stroke-width", 3);
              if (code === "DC") {
                d3.select("#dc-circle").attr("stroke", "#000").attr("stroke-width", 3);
              }
            }
          })
          .on("mouseout", () => {
            if (!d3.select(`#sidebar-${code}`).classed("selected")) {
              d3.select(`#sidebar-${code}`).attr("stroke", "#fff").attr("stroke-width", 1);
              d3.select(`#state-${code}`)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
              if (code === "DC") {
                d3.select("#dc-circle").attr("stroke", "#fff").attr("stroke-width", 1.5);
              }
            }
          })
          .on("click", function() {
            const me = d3.select(this),
                  was = me.classed("selected");

            // deselect map + sidebar
            svg.selectAll("path.state").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);
            d3.select("#dc-circle").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1.5);
            d3.selectAll("rect.sidebar-rect").classed("selected", false).attr("stroke", "#fff").attr("stroke-width", 1);

            if (!was) {
              me.classed("selected", true).attr("stroke", "#000").attr("stroke-width", 4);
              d3.select(`#state-${code}`)
                .attr("stroke", "#000")
                .classed("selected", true)
                .attr("stroke-width", 4);

              if (code === "DC") {
                d3.select("#dc-circle")
                  .classed("selected", true)
                  .attr("stroke", "#000")
                  .attr("stroke-width", 4);
              }
              updatePlots(code);
            } else {
              resetPlots();
            }
          });
  
        // State label
        sidebar.append("text")
          .text(`${code}`)
          .attr("x", 75)
          .attr("y", y - 22)
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", "12px")
          .attr("fill", "#fff")
          .attr("pointer-events", "none");
  
        // Electoral votes
        sidebar.append("text")
          .text(electoralVotes)
          .attr("x", 75)
          .attr("y", y-10)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#eee")
          .attr("pointer-events", "none");
      });
    });

    svg.append("text")
      .attr("x", 80 + (width/2))
      .attr("y", 0)
      .attr("text-anchor","middle")
      .style("font-size","20px").style("font-weight","bold")
      .text("U.S. 2024 Presidential Election Results");
  
    console.log("Finished drawing map");
}

function updatePlots(stateCode){
  // if(!barSelected) {
  //   drawEvBarChart(data.presidentResults.stateLevel, data.demPartyCandidate, data.repPartyCandidate, stateCode);
  //   barSelected = true;
  // }
  drawEvBarChart(data.presidentResults.stateLevel, data.demPartyCandidate, data.repPartyCandidate, stateCode);
  drawVotesBarChart(data.presidentResults.stateLevel.votes, data.codeToState, data.demPartyCandidate, data.repPartyCandidate, stateCode);
  drawTurnoutPlot(data.turnout.stateLevel.details, data.houseResults.votes, data.senateResults.votes, data.presidentResults.stateLevel.votes, stateCode);
  drawSplitVotingPlot(data.presidentResults.cdLevel.votes, data.presidentResults.stateLevel.votes, data.houseResults.votes, data.senateResults.votes, stateCode)

  pcpStateCode = stateCode;
  document.getElementById("raceToggleBtn").innerText = showRaceDetails ? "General Details" : "Race Details";
  // showRaceDetails = false;
  drawPcpPlot(showRaceDetails ? data.countyRaceDetails : data.countyDetails, showRaceDetails ? pcpRaceFeatures : pcpGeneralFeatures, showRaceDetails, stateCode)

  counter = 0;
  d3.selectAll(".point").classed("selected", false).attr("stroke-width", 1).attr("stroke", "rgb(136,136,136)");
  d3.selectAll("text[id^='label-']").remove();
}

function drawCountyLevel(){
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(us => {
    const counties = topojson.feature(us, us.objects.counties).features;
  });  
}