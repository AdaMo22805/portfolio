let data = [];
let commits = [];
let xScale = 0;
let yScale = 0;
updateTooltipVisibility(false);

let brushSelection = null;
let selectedCommits = [];
let commitProgress = 100;
let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

let filteredCommits = [];
let filteredData = [];

function updateFileList(files) {
  d3.select('.files').selectAll('div').remove(); // don't forget to clear everything first so we can re-render
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  let dt = filesContainer.append('dt');
  dt.append('code').text(d => d.name);

  // Append <small> inside <dt> (inside .each() to retain d)
  dt.each(function(d) {
    d3.select(this).append('small').text(`${d.lines.length} lines`);
  });
  // filesContainer.append('dd').text(`${d.lines.length} lines`);  // TODO
  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines) // Bind each line to a div
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}


async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    // console.log(data);
    processCommits();
    displayStats(commits, data);
    // console.log(commits);
    let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
    let commitMaxTime = timeScale.invert(commitProgress);

    // const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');

    function updateCommitTime(progress) {
      commitMaxTime = timeScale.invert(progress);
      selectedTime.textContent = commitMaxTime.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short"
      });
      filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
      filteredData = data.filter(d => d.datetime <= commitMaxTime);
      displayStats(filteredCommits, filteredData);

      let lines = filteredCommits.flatMap((d) => d.lines);
      let files = [];
      files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
          return { name, lines };
        });
      files = d3.sort(files, (d) => -d.lines.length);
      updateFileList(files)
      updateScatterplot(filteredCommits)
    }

    // Event listener for slider changes
    slider.addEventListener("input", function () {
      commitProgress = +this.value;
      selectedTime.textContent = timeScale.invert(commitProgress).toLocaleString();
      updateCommitTime(commitProgress);
      filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
      updateScatterplot(filteredCommits)
      // console.log(filteredCommits);
    });

    // Initialize UI with starting values
    updateCommitTime(commitProgress);
}

// function createScatterplot(){
function updateScatterplot(filteredCommits){
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  // const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

  const width = 1000;
  const height = 600;

  d3.select('#chart svg').remove();

  d3.select('svg').remove(); // first clear the svg
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  // const 
  xScale = d3
  .scaleTime()
  // .domain(d3.extent(commits, (d) => d.datetime))
  .domain(d3.extent(filteredCommits, (d) => d.datetime))
  .range([0, width])
  .nice();

  // const 
  yScale = d3
  .scaleLinear()
  .domain([0, 24])
  .range([height, 0]);

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickSize(-usableArea.width).tickFormat(''));

  gridlines.lower();

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  svg.selectAll('.dots').remove(); // clear the scatters in order to re-draw the filtered ones
  const dots = svg.append('g').attr('class', 'dots');
  // const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  // dots.selectAll('circle').remove(); 
  dots
    .selectAll('circle')
    // .data(sortedCommits)
    .data(filteredCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', function (event, d, i) {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
      d3.select(event.currentTarget).classed('selected', 1); // give it a corresponding boolean value
    })
    .on('mouseleave', function (event, d) {
      d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
      updateTooltipContent({});
      updateTooltipVisibility(false);
      d3.select(event.currentTarget).classed('selected', 0); // give it a corresponding boolean value
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  // createScatterplot();
  // console.log(filteredCommits);
  updateScatterplot(filteredCommits)
  brushSelector();
});

// let commits = d3.groups(data, (d) => d.commit);
// console.log(commits)

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        // Each 'lines' array contains all lines modified in this commit
        // All lines in a commit have the same author, date, etc.
        // So we can get this information from the first line
        let first = lines[0];
        // We can use object destructuring to get these properties
        let { author, date, time, timezone, datetime } = first;
  
        // What information should we return about this commit?
        let ret = {
          id: commit,
          url: 'https://github.com/AdaMo22805/portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          // Calculate hour as a decimal for time analysis
          // e.g., 2:30 PM = 14.5
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          // How many lines were modified?
          totalLines: lines.length,
        };
        
        Object.defineProperty(ret, 'lines', {
          value: lines,
          configurable: false, // Cannot be redefined or deleted
          writable: false,     // Cannot be modified
          enumerable: false    // Hidden from enumeration
        });

        return ret;
      });
      filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
      updateScatterplot(filteredCommits)
      // console.log(filteredCommits);
  }
  // console.log(filteredCommits);

  function displayStats(commitGrp, dataGrp) {
    // Process commits first
    // processCommits();
    
    d3.select('#stats').selectAll('*').remove();

    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commitGrp.length);

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(dataGrp.length);

    // Add max depth of file
    dl.append('dt').html('Max Lines');
    dl.append('dd').text(d3.max(commitGrp, (d) => d.totalLines));

    // Add number of authors
    let authorGroups = d3.groups(commitGrp, (d) => d.author);
    let numAuthors = authorGroups.length;
    dl.append('dt').html('Authors');
    dl.append('dd').text(numAuthors);

    // Add most common day for commits
    let dayCounts = d3.rollup(
      commitGrp,
      (v) => v.length, // Count occurrences
      (d) => d.datetime.getDay() // Get day of the week (0-6)
    );
    
    //   // Find the most common day
    // let mostCommonDay = [...dayCounts.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    
    //   // Map numeric days to names
    // let dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    // let mostCommonDayName = dayNames[mostCommonDay];
    let mostCommonDay = [...dayCounts.entries()]
        .reduce((a, b) => (a[1] > b[1] ? a : b), [null, 0])[0];

    let dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    let mostCommonDayName = mostCommonDay !== null ? dayNames[mostCommonDay] : 'N/A';


    dl.append('dt').html('Freq Commit Day');
    dl.append('dd').text(mostCommonDayName);
  }

  function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const line = document.getElementById('commit-line');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    line.textContent = commit.totalLines;
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  function brushSelector() {
    const svg = document.querySelector('svg');
    // const svg = d3.select('#chart svg');
    // const dots = svg.select('.dots');
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
  }

  // function brushed(event) {
  //   let brushSelection = event.selection;
  //   updateSelection();
  //   updateSelectionCount();
  //   updateLanguageBreakdown();
  // }
  function brushed(evt) {
    let brushSelection = evt.selection;
    selectedCommits = !brushSelection
      ? []
      // : commits.filter((commit) => {
      : filteredCommits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.date);
          let y = yScale(commit.hourFrac);
  
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
      updateSelection();
      updateSelectionCount();
      // updateLanguageBreakdown();
  }

  
  // function isCommitSelected(commit) {
  //   if (!brushSelection) return false;
  //   const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
  //   const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
  //   const x = xScale(commit.date); const y = yScale(commit.hourFrac); 
  //   return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 
  // }
  function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
  }
  
  function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  }

  function updateSelectionCount() {
    // const selectedCommits = brushSelection
    //   ? commits.filter(isCommitSelected)
    //   // ? filteredCommits.filter(isCommitSelected)
    //   : [];
  
    // const countElement = document.getElementById('selection-count');
    // countElement.textContent = `${
    //   selectedCommits.length || 'No'
    // } commits selected`;
  
    // return selectedCommits;
    const countElement = document.getElementById('selection-count');
    
    // ✅ Use selectedCommits directly
    countElement.textContent = `${
      selectedCommits.length > 0 ? selectedCommits.length : 'No'
    } commits selected`;
  }

  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
  }
