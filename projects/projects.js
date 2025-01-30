import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let count = projects.length
// console.log(count)
renderProjects(projects, projectsContainer, 'h2');
const title = document.querySelector('.projects-title');
title.innerHTML = `${count} Projects`;