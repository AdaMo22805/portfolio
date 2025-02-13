let data = [];
let commits = [];
const width = 1000;
const height = 600;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    displayStats();
}

function createScatterplot(){
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

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

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

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

  const dots = svg.append('g').attr('class', 'dots');
  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot();
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
  }

  function displayStats() {
    // Process commits first
    processCommits();

    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Add max depth of file
    dl.append('dt').html('Max Lines');
    dl.append('dd').text(d3.max(commits, (d) => d.totalLines));

    // Add number of authors
    let authorGroups = d3.groups(commits, (d) => d.author);
    let numAuthors = authorGroups.length;
    dl.append('dt').html('Authors');
    dl.append('dd').text(numAuthors);

    // Add most common day for commits
    let dayCounts = d3.rollup(
      commits,
      (v) => v.length, // Count occurrences
      (d) => d.datetime.getDay() // Get day of the week (0-6)
    );
    
      // Find the most common day
    let mostCommonDay = [...dayCounts.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    
      // Map numeric days to names
    let dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    let mostCommonDayName = dayNames[mostCommonDay];

    dl.append('dt').html('Freq Commit Day');
    dl.append('dd').text(mostCommonDayName);
  }