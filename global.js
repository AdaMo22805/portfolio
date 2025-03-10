console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'resume/index.html', title: 'Resume' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'meta/index.html', title: 'Meta' },
    { url: 'https://github.com/AdaMo22805.html', title: 'Github' },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // TODO create link and add it to nav
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host != location.host) {
        a.target = "_blank";
    }
  }

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select class=one>
            <option value="light dark"> Automatic </option>
            <option value="light"> Light </option>
            <option value="dark"> Dark </option>
          </select>
      </label>`
  );

let select = document.querySelector(".one");

if ("colorScheme" in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme;
}

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
  });

let form = document.querySelector("form");
form?.addEventListener('submit', function (event) {
  event.preventDefault();
  let data = new FormData(form);
  let url = form.action + "?";
  for (let [name, value] of data) {
    // TODO build URL parameters here
    value = encodeURIComponent(value)
    console.log(name, value);
    url += `${encodeURIComponent(name)}=${value}&`;
  }
  console.log("Final URL:", url);
  location.href = url;
});

export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      // console.log(response)
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      // console.log(data)
      return data; 

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  // write javascript that will allow dynamic heading levels based on previous function
  containerElement.innerHTML = '';

  for (const p of project) {
    const article = document.createElement('article');
    const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadingLevels.includes(headingLevel)) {
      headingLevel = 'h2';
    }
    article.innerHTML = `
    <${headingLevel}>${p.title}</${headingLevel}>
    <a href="${p.link}" target="_blank">
      <img src="${p.image}" alt="${p.title}">
    </a>
    <div>
      <p>${p.description}</p>
      <p class="year">${p.year}</p>
    </div>
`;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}


