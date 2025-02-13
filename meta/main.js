let data = [];
let commits = [];

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

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
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