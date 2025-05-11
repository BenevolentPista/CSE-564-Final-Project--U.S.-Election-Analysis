function drawUsaMap(votes, codeToState, fipsToState, demPartyCandidate, repPartyCandidate) {
    console.log("votes = ")
    console.log(votes)
    const smallStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC", "HI"];
    const scale = 100
    const width = 960, height = 600;

    const colorScale = (margin) => {
      const absMargin = Math.abs(margin);
      const isDem = margin >= 0;
      if (absMargin < 1) return isDem ? "rgb(148, 155, 179)" : "rgb(207, 137, 128)";
      if (absMargin < 5) return isDem ? "rgb(138, 175, 255)" : "rgb(255, 139, 152)";
      if (absMargin < 15) return isDem ? "rgb(87, 124, 204)" : "rgb(255, 88, 101)";
      return isDem ? "rgb(28, 64, 140)" : "rgb(191, 29, 41)";
    };
  
    const svg = d3.select("#geoMapUSA")
      .append("svg")
      .attr("viewBox", `50 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "100%");

    // Add top labels for candidates
    const labelGroup = svg.append("g")
    .attr("class", "candidate-labels")
    .attr("transform", `translate(${width / 2 - 200}, 10)`);

    const demLabels = ["Safe Democratic state where margin of victory was >= 15%", "Likely Democratic state where margin of victory was >= 5% and < 15%", "Lean Democratic state where margin of victory was >= 1% and < 5%", "Tilt Democratic state where margin of victory was < 1%"];
    const repLabels = ["Safe Republican state where margin of victory was >= 15%", "Likely Republican state where margin of victory was >= 5% and < 15%", "Lean Republican state where margin of victory was >= 1% and < 5%", "Tilt Republican state where margin of victory was < 1%"];
    
    // Democratic candidate label
    const demGroup = labelGroup.append("g").attr("transform", `translate(80, 0)`);

    demGroup.append("rect")
    .attr("width", 180)
    .attr("height", 30)
    .attr("fill", "rgb(28, 64, 140)")
    .attr("rx", 6);

    demGroup.append("text")
    .text(demPartyCandidate)
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

    repGroup.append("rect")
    .attr("width", 180)
    .attr("height", 30)
    .attr("fill", "rgb(191, 29, 41)")
    .attr("rx", 6);

    repGroup.append("text")
    .text(repPartyCandidate)
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
  
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
      const states = topojson.feature(us, us.objects.states).features;
      const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "FeatureCollection", features: states });
      const path = d3.geoPath().projection(projection);
  
      // Draw states
      svg.selectAll("path")
        .data(states)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const fips = d.id.toString().padStart(2, "0");
          const stateCode = fipsToState[fips];
          const voteData = votes[stateCode];
          if (!voteData) return "#ccc";
          // const margin = parseFloat(voteData["D Vote Percentage"]) - parseFloat(voteData["R Vote Percentage"]);
          return colorScale(parseFloat(voteData["margin"]));
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("cursor", "pointer")
        .on("mouseover", function () {
          d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
        })
        .on("click", function (event, d) {
            const fips = d.id.toString().padStart(2, "0");
            const stateCode = fipsToState[fips];
          
            const isSelected = d3.select(this).classed("selected");
          
            d3.selectAll("path").classed("selected", false); // Deselect all
          
            if (!isSelected) {
              // If it was not selected, now we're selecting it
              d3.select(this).classed("selected", true);
              drawBarChart(votes, codeToState, stateCode, demPartyCandidate, repPartyCandidate);
            } else {
              // It was selected, now we're deselecting it
              drawBarChart(votes, codeToState, "US", demPartyCandidate, repPartyCandidate);
            }
          })             
        .attr("id", d => `state-${fipsToState[d.id.toString().padStart(2, "0")]}`);

        // Add a dot for DC since it's hard to see
        const dcFeature = states.find(d => fipsToState[d.id.toString().padStart(2, "0")] === "DC");

        if (dcFeature) {
            const centroid = path.centroid(dcFeature);
            const dcCode = "DC";
            const dcData = votes[dcCode];
            const margin = parseFloat(dcData["margin"]);
            const color = colorScale(margin);

            svg.append("circle")
                .attr("cx", centroid[0])
                .attr("cy", centroid[1])
                .attr("r", 6)
                .attr("fill", color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .attr("id", "dc-circle")
                .attr("cursor", "pointer")
                .on("mouseover", () => {
                    d3.select("#dc-circle").attr("stroke", "#000").attr("stroke-width", 3);
                })
                .on("mouseout", () => {
                    if (!d3.select("#dc-circle").classed("selected")) {
                    d3.select("#dc-circle").attr("stroke", "#fff").attr("stroke-width", 1.5);
                    }
                })
                .on("click", function () {
                    const isSelected = d3.select(this).classed("selected");

                    d3.selectAll("path").classed("selected", false); // Deselect map states
                    d3.select("#dc-circle").classed("selected", !isSelected);

                    if (!isSelected) {
                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
                    drawBarChart(votes, codeToState, "DC", demPartyCandidate, repPartyCandidate);
                    } else {
                    d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
                    drawBarChart(votes, codeToState, "US", demPartyCandidate, repPartyCandidate);
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
  
      // Add electoral vote count
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
  
      smallStates.forEach((code, i) => {
        const y = 200 + i * 35;
        const voteData = votes[code];
        const margin = parseFloat(voteData["margin"]);
        const fillColor = colorScale(margin);
        const electoralVotes = voteData ? voteData["evs"] : "";
  
        // Background rectangle
        sidebar.append("rect")
        .attr("x", 35)
        .attr("y", y - 14)
        .attr("width", 40)
        .attr("height", height/20)
        .attr("rx", 4)
        .attr("fill", fillColor)
        .attr("cursor", "pointer")
        .attr("id", `sidebar-${code}`) // add id for later reference
        .classed("selected", false)
        .on("mouseover", () => {
            d3.select(`#state-${code}`).attr("stroke", "#000").attr("stroke-width", 3);
            if (code === "DC") {
                d3.select("#dc-circle").attr("stroke", "#000").attr("stroke-width", 3);
            }
        })
        .on("mouseout", () => {
            const isSelected = d3.select(`#sidebar-${code}`).classed("selected");
            if (!isSelected) {
            d3.select(`#state-${code}`).attr("stroke", "#fff").attr("stroke-width", 1);
            if (code === "DC") {
                d3.select("#dc-circle").attr("stroke", "#fff").attr("stroke-width", 1.5);
            }
            }
        })
        .on("click", function () {
            const isSelected = d3.select(this).classed("selected");

            // Deselect all other elements (states, circles, and sidebar)
            d3.selectAll("path").classed("selected", false);
            d3.selectAll("#dc-circle").classed("selected", false);
            d3.selectAll("rect").classed("selected", false);

            // Toggle current one
            d3.select(this).classed("selected", !isSelected);

            if (!isSelected) {
              drawBarChart(votes, codeToState, code, demPartyCandidate, repPartyCandidate);
            } else {
              drawBarChart(votes, codeToState, "US", demPartyCandidate, repPartyCandidate);
            }
        });          
  
        // State label
        sidebar.append("text")
          .text(`${code}`)
          .attr("x", 55)
          .attr("y", y - 2)
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", "12px")
          .attr("fill", "#fff")
          .attr("pointer-events", "none");
  
        // Electoral votes
        sidebar.append("text")
          .text(electoralVotes)
          .attr("x", 55)
          .attr("y", y + 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#eee")
          .attr("pointer-events", "none");
      });
    });
  
    console.log("Finished drawing map");
}

function drawCountyLevel(){
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(us => {
    const counties = topojson.feature(us, us.objects.counties).features;
  });  
}