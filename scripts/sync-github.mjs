import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { username, featuredRepositories } from '../js/github-config.mjs';

const headers = { 'User-Agent': 'portfolio-github-sync', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function request(url, api = true) {
  const response = await fetch(url, {
    headers: api ? headers : { 'User-Agent': 'portfolio-github-sync', 'Accept-Language': 'en-US' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}): ${url}`);
  return api ? response.json() : response.text();
}

// The public profile calendar lets us generate the first snapshot without secrets.
const [profile, calendar, repositories] = await Promise.all([
  request(`https://api.github.com/users/${username}`),
  request(`https://github.com/users/${username}/contributions`, false),
  Promise.all(featuredRepositories.map(name => request(`https://api.github.com/repos/${username}/${encodeURIComponent(name)}`)))
]);
const heading = calendar.match(/<h2\b[^>]*\bid="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/i);
const total = heading?.[1].replace(/<[^>]*>/g, ' ').match(/([\d,]+)\s+contributions?\s+in the last year/i);
if (!total) throw new Error('Could not read the public contribution calendar; previous snapshot preserved.');
const snapshot = {
  username,
  updated_at: new Date().toISOString(),
  public_repos: profile.public_repos,
  followers: profile.followers,
  contributions: Number(total[1].replaceAll(',', '')),
  repositories: repositories.map(repo => {
    if (repo.private || repo.owner?.login.toLowerCase() !== username.toLowerCase()) throw new Error('Unexpected repository.');
    return { name: repo.name, description: repo.description, stargazers_count: repo.stargazers_count };
  })
};
for (const key of ['public_repos', 'followers', 'contributions']) {
  if (!Number.isInteger(snapshot[key]) || snapshot[key] < 0) throw new Error(`Invalid ${key}.`);
}
// All requests must succeed before replacing the last good snapshot.
const htmlPath = new URL('../index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
const marker = /(<script id="github-snapshot" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!marker.test(html)) throw new Error('Missing embedded GitHub snapshot in index.html.');
// Escape < so repository descriptions cannot close the script element.
const embedded = JSON.stringify(snapshot).replaceAll('<', '\\u003c');
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/github.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
await writeFile(htmlPath, html.replace(marker, (_, open, close) => open + embedded + close));
console.log(`GitHub snapshot updated: ${snapshot.contributions} contributions, ${repositories.length} featured repositories.`);
