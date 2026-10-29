(function () {
  'use strict';

  var data;
  try { data = JSON.parse(document.getElementById('github-snapshot').textContent); }
  catch (error) { data = {}; }
  var username = data.username || '0xthearchitect';
  var featuredRepositories = (data.repositories || []).map(function (repo) { return repo.name; });
  var list = document.getElementById('github-repos');
  var status = document.getElementById('github-status');
  var snapshotDate;
  var snapshotTime = 0;

  function count(id, value) {
    if (Number.isInteger(value) && value >= 0) {
      document.getElementById(id).textContent = value.toLocaleString('en-US');
    }
  }

  function icon(name, className) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  function repositories(repos) {
    list.replaceChildren();
    repos.slice(0, 3).forEach(function (repo) {
      var row = document.createElement('li');
      row.className = 'repo';
      row.appendChild(icon('github', 'icon repo-icon'));
      var info = document.createElement('div');
      info.className = 'repo-info';
      var link = document.createElement('a');
      // Build the URL from the known account and an encoded repository name.
      link.href = 'https://github.com/' + username + '/' + encodeURIComponent(repo.name);
      link.className = 'repo-name';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = repo.name;
      var description = document.createElement('p');
      description.className = 'repo-desc';
      description.textContent = repo.description || 'No description provided.';
      info.append(link, description);
      row.appendChild(info);
      var stars = document.createElement('span');
      stars.className = 'repo-stars';
      stars.setAttribute('aria-label', repo.stargazers_count + ' stars');
      stars.append(icon('star', 'icon'), document.createTextNode(' ' + repo.stargazers_count));
      row.appendChild(stars);
      list.appendChild(row);
    });
    if (!repos.length) message('No featured repositories available.');
  }

  function message(text) {
    var item = document.createElement('li');
    item.className = 'repo-message';
    item.textContent = text;
    list.replaceChildren(item);
  }

  async function json(url) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 5000);
    try {
      var response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('GitHub data unavailable');
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function load() {
    var hasSnapshot = false;
    // Embedded data renders synchronously, including when opened via file://.
    try {
      if (data.username !== username || !Array.isArray(data.repositories)) throw new Error('Invalid snapshot');
      count('github-repositories', data.public_repos);
      count('github-followers', data.followers);
      count('github-contributions', data.contributions);
      repositories(data.repositories.filter(function (repo) { return featuredRepositories.includes(repo.name); }));
      snapshotDate = new Date(data.updated_at).toLocaleString('en-GB');
      snapshotTime = Date.parse(data.updated_at) || 0;
      hasSnapshot = true;
      status.textContent = 'GitHub data synced: ' + snapshotDate + '.';
    } catch (error) {
      status.textContent = 'Saved GitHub data unavailable; trying a live refresh.';
    }

    var results = await Promise.allSettled([
      json('https://api.github.com/users/' + username).then(function (profile) {
        count('github-repositories', profile.public_repos);
        count('github-followers', profile.followers);
        return profile;
      }),
      Promise.all(featuredRepositories.map(function (name) {
        return json('https://api.github.com/repos/' + username + '/' + encodeURIComponent(name));
      })).then(function (repos) { repositories(repos); return repos; }),
      json('https://raw.githubusercontent.com/' + username + '/Profissional-Portfolio/main/data/github.json')
    ]);
    var profileOK = results[0].status === 'fulfilled';
    var reposOK = results[1].status === 'fulfilled' && Array.isArray(results[1].value);
    if (profileOK) {
      count('github-repositories', results[0].value.public_repos);
      count('github-followers', results[0].value.followers);
    }
    if (reposOK) repositories(results[1].value);
    if (results[2].status === 'fulfilled') {
      var latest = results[2].value;
      if (latest.username === username && Number.isInteger(latest.contributions) && latest.contributions >= 0 && Date.parse(latest.updated_at) > snapshotTime) {
        count('github-contributions', latest.contributions);
        snapshotDate = new Date(latest.updated_at).toLocaleString('en-GB');
        hasSnapshot = true;
      }
    }
    if (!reposOK && !hasSnapshot) message('Repositories could not be loaded. View them on GitHub using the link above.');
    status.textContent = profileOK && reposOK
      ? (hasSnapshot ? 'GitHub data loaded. Contributions synced: ' + snapshotDate + '.' : 'GitHub data loaded. Contribution count temporarily unavailable.')
      : (hasSnapshot ? 'Showing saved GitHub data from ' + snapshotDate + '; live refresh unavailable.' : 'Some GitHub data could not be loaded. Please try again later.');
  }

  load();
})();
