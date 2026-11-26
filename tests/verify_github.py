"""Browser checks: run with Python + Playwright (Chromium installed)."""
import functools
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


root = Path(__file__).resolve().parents[1]
actual = json.loads((root / 'data/github.json').read_text(encoding='utf-8'))
stars = {repo['full_name'].lower(): repo['stargazers_count'] for repo in actual['repositories']}
server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
newer = dict(actual, contributions=1500, updated_at='2099-01-01T00:00:00Z')


def star_text(page, repo):
    return page.locator(f'[data-repo="{repo}"]').inner_text()


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
        for scenario in ['live', 'saved', 'refresh', 'slow', 'file', 'english']:
            page = browser.new_page()
            errors, pending = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            # Record what the page shows before its first network request.
            page.add_init_script("""
                const originalFetch = window.fetch;
                window.fetch = function (...args) {
                    if (!window.firstGitHubRequest) {
                        window.firstGitHubRequest = {
                            contributions: document.getElementById('github-contributions').textContent,
                            beatbox: document.querySelector('[data-repo="0xthearchitect/beatbox"]').textContent
                        };
                    }
                    return originalFetch.apply(this, args);
                };
            """)
            if scenario == 'english':
                page.add_init_script("localStorage.setItem('lang', 'en')")

            def respond(route):
                url = route.request.url
                if scenario in ['slow', 'file']:
                    pending.append(route)
                    return  # Keep remote requests pending: the page must already show data.
                if 'raw.githubusercontent.com' in url:
                    route.fulfill(json=newer if scenario == 'refresh' else actual)
                elif scenario == 'saved':
                    route.fulfill(status=403, body='{}')
                elif '/repos/' in url:
                    full = '/'.join(url.split('/repos/')[1].split('/')[:2])
                    route.fulfill(json={'full_name': full.replace('%2F', '/'), 'stargazers_count': 8,
                                        'description': '<img src=x onerror=alert(1)>'})
                else:
                    route.fulfill(json={'public_repos': 30, 'followers': 9})

            page.route('https://api.github.com/**', respond)
            page.route('https://raw.githubusercontent.com/**', respond)
            url = (root / 'index.html').as_uri() if scenario == 'file' else f'http://127.0.0.1:{server.server_port}/'
            page.goto(url, wait_until='domcontentloaded')
            initial = page.evaluate('window.firstGitHubRequest')
            assert initial['contributions'] == str(actual['contributions']), initial
            assert initial['beatbox'] == f"★ {stars['0xthearchitect/beatbox']}", initial
            if scenario not in ['slow', 'file']:
                page.wait_for_function("/live|direto|unavailable|sem atualização/.test(document.getElementById('github-status').textContent)")
            if scenario == 'live':
                assert page.locator('#github-repositories').inner_text() == '30'
                assert star_text(page, 'Reinvicta-Tech/caraDBela') == '★ 8'
                assert page.locator('#projetos img[src="x"]').count() == 0  # descriptions are never rendered as HTML
                page.set_viewport_size({'width': 390, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            elif scenario == 'saved':
                assert page.locator('#github-repositories').inner_text() == str(actual['public_repos'])
                assert 'sem atualização' in page.locator('#github-status').inner_text()
            elif scenario == 'refresh':
                assert page.locator('#github-contributions').inner_text() in ['1500', '1 500', '1 500']
            elif scenario == 'english':
                assert page.locator('#percurso h2').inner_text() == 'Experience'
                page.locator('.lang[data-lang="pt"]').click()
                assert page.locator('#percurso h2').inner_text() == 'Percurso'
            # Interactions: project tabs and the keyboard modes.
            page.locator('#tab-mimic').click()
            assert page.locator('#p-mimic').is_visible() and not page.locator('#p-beatbox').is_visible()
            page.locator('[data-mode-set="break"]').click()
            assert page.locator('.kbd').get_attribute('data-mode') == 'break'
            assert page.locator('.key[data-b="TypeScript"] .main').inner_text() == 'Burp Suite'
            page.locator('.key[data-b="TypeScript"]').click()
            assert page.locator('.typed').inner_text() == 'burp-suite'
            assert not errors, errors
            for route in pending:
                route.abort()
            page.close()
            print(f'PASS: {scenario}')
        browser.close()
finally:
    server.shutdown()
