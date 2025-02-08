import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let count = projects.length
renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
title.innerHTML = `${count} Projects`;

let arcGenerator = d3.arc().innerRadius(30).outerRadius(50);

let selectedIndex = -1;
let query = '';
let selectedYear = null;

function filterProjects(renderPie=false) { // Unified filtering function
    let filteredProjects = projects.filter(project => {
        let matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase());
        let matchesYear = selectedYear ? project.year.toString() === selectedYear : true;
        return matchesQuery && matchesYear;
    });

    projectsContainer.innerHTML = '';
    renderProjects(filteredProjects, projectsContainer, 'h2');
    if (renderPie){
        renderPieChart(filteredProjects);
    }
}

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

    newArcs.forEach((arc,i) => {
        d3
        .select('svg')
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        selectedYear = (selectedYear === newData[i].label) ? null : newData[i].label;

        newSVG
            .selectAll('path')
            .attr('class', (_, i) => (
                selectedIndex === i ? 'selected' : ''
            ));
        legend
            .selectAll('li')
            .attr('class', (_, idx) => (
                selectedIndex === idx ? 'swatch selected' : 'swatch'
        ));
        if (selectedIndex === -1) {
            // renderProjects(projects, projectsContainer, 'h2');
            newSVG.classed('has-selection', false);
        } else {
            newSVG.classed('has-selection', true);
            let filteredProjects = projects.filter(project => project.year.toString() === newData[i].label);
            // renderProjects(filteredProjects, projectsContainer, 'h2');

        }
            filterProjects(selectedIndex === -1);
        });;
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

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  filterProjects(true);
});