(function () {
  'use strict';

  var data;
  try { data = JSON.parse(document.getElementById('github-snapshot').textContent); }
  catch (error) { data = {}; }
  var username = data.username || '0xthearchitect';
  // The projects on the page, as "owner/name"; star counts are matched case-insensitively.
  var featured = Array.prototype.map.call(document.querySelectorAll('[data-repo]'), function (el) { return el.dataset.repo; });
  var status = document.getElementById('github-status');
  var syncedAt = 0;
  var state = 'none'; // none | saved | live | stale

  var shown = {};
  function count(id, value) {
    if (Number.isInteger(value) && value >= 0) {
      shown[id] = value;
      document.getElementById(id).textContent = value.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'pt-PT');
    }
  }

  function stars(repos) {
    var byName = {};
    repos.forEach(function (repo) {
      if (repo && repo.full_name && Number.isInteger(repo.stargazers_count)) byName[repo.full_name.toLowerCase()] = repo.stargazers_count;
    });
    document.querySelectorAll('[data-repo]').forEach(function (el) {
      var n = byName[el.dataset.repo.toLowerCase()];
      if (n === undefined) return;
      el.textContent = '★ ' + n;
      el.hidden = n === 0; // a project with no stars simply shows none
      var en = document.documentElement.lang === 'en';
      el.setAttribute('aria-label', n + (en ? (n === 1 ? ' star' : ' stars') + ' on GitHub' : (n === 1 ? ' estrela' : ' estrelas') + ' no GitHub'));
    });
  }

  function showStatus() {
    var en = document.documentElement.lang === 'en';
    var when = syncedAt ? new Date(syncedAt).toLocaleDateString(en ? 'en-GB' : 'pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    status.textContent = {
      none: '',
      saved: en ? 'GitHub data from ' + when : 'Dados do GitHub de ' + when,
      live: en ? 'GitHub data live' : 'Dados do GitHub em direto',
      stale: en ? 'GitHub data from ' + when + ' (live refresh unavailable)' : 'Dados do GitHub de ' + when + ' (sem atualização em direto)'
    }[state];
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

  function applySnapshot(snapshot) {
    count('github-repositories', snapshot.public_repos);
    count('github-contributions', snapshot.contributions);
    if (Array.isArray(snapshot.repositories)) stars(snapshot.repositories);
    syncedAt = Date.parse(snapshot.updated_at) || syncedAt;
  }

  async function load() {
    // Embedded data renders synchronously, including when opened via file://.
    if (data.username === username && Array.isArray(data.repositories)) {
      applySnapshot(data);
      state = 'saved';
    }
    showStatus();

    var results = await Promise.allSettled([
      json('https://api.github.com/users/' + username),
      Promise.all(featured.map(function (full) {
        var parts = full.split('/');
        return json('https://api.github.com/repos/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]));
      })),
      json('https://raw.githubusercontent.com/' + username + '/Profissional-Portfolio/main/data/github.json')
    ]);
    var profileOK = results[0].status === 'fulfilled';
    var reposOK = results[1].status === 'fulfilled';
    if (profileOK) count('github-repositories', results[0].value.public_repos);
    if (reposOK) stars(results[1].value);
    // Contributions are not in the API: take them from the newest published snapshot.
    if (results[2].status === 'fulfilled') {
      var latest = results[2].value;
      if (latest.username === username && Number.isInteger(latest.contributions) && latest.contributions >= 0 && Date.parse(latest.updated_at) > syncedAt) {
        count('github-contributions', latest.contributions);
        syncedAt = Date.parse(latest.updated_at);
        if (state === 'none') state = 'saved';
      }
    }
    state = profileOK && reposOK ? 'live' : (syncedAt ? 'stale' : 'none');
    showStatus();
  }

  document.addEventListener('langchange', function () {
    Object.keys(shown).forEach(function (id) { count(id, shown[id]); });
    showStatus();
  });
  load();
})();
