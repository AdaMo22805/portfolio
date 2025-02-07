import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let count = projects.length
// console.log(count)
renderProjects(projects, projectsContainer, 'h2');
const title = document.querySelector('.projects-title');
title.innerHTML = `${count} Projects`;

// let arc = d3.arc().innerRadius(0).outerRadius(50)({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });
// d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');



// let data = [1, 2, 3, 4, 5, 5];


// let data = [
//     { value: 1, label: 'apples' },
//     { value: 2, label: 'oranges' },
//     { value: 3, label: 'mangos' },
//     { value: 4, label: 'pears' },
//     { value: 5, label: 'limes' },
//     { value: 5, label: 'cherries' },
//   ];












// let colors = d3.scaleOrdinal(d3.schemeTableau10);

// let rolledData = d3.rollups(
//     projects,
//     (v) => v.length,
//     (d) => d.year,
//   );
  
// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
// });

// let sliceGenerator = d3.pie().value((d) => d.value);
// let arcData = sliceGenerator(data);

// let arcs = arcData.map((d) => arcGenerator(d));

// arcs.forEach((arc,idx) => {
//     // TODO, fill in step for appending path to svg using D3
//     d3.select('svg').append('path').attr('d', arc).attr('fill', colors(idx));
// });

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//     legend.append('li')
//         .attr('class', 'swatch')
//         .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
//         .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
// })

function renderPieChart(projectsGiven) {

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);

    let newArcs = newArcData.map((d) => arcGenerator(d));

    let newSVG = d3.select('svg'); 
    newSVG.selectAll('path').remove();

    newArcs.forEach((arc,idx) => {
        // TODO, fill in step for appending path to svg using D3
        d3.select('svg').append('path').attr('d', arc).attr('fill', colors(idx));
    });

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('class', 'swatch')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    })
}
renderPieChart(projects);


// let projects = ...; // fetch your project data
// let rolledData = d3.rollups(
//   projects,
//   (v) => v.length,
//   (d) => d.year,
// );

// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
//   });



let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  projectsContainer.innerHTML = ''; //
  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);//
});

// searchInput.addEventListener('change', (event) => {
//     let filteredProjects = setQuery(event.target.value);
//     // re-render legends and pie chart when event triggers
//     renderProjects(filteredProjects, projectsContainer, 'h2');
//     renderPieChart(filteredProjects);
//   });
