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
server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
snapshot = {
    'username': '0xthearchitect', 'updated_at': '2026-10-29T09:00:00Z',
    'public_repos': 20, 'followers': 7, 'contributions': 1234,
    'repositories': [{'name': 'WhatIf', 'description': None, 'stargazers_count': 0}],
}
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
        for scenario in ['live', 'saved', 'bundled', 'refresh', 'slow', 'file']:
            page = browser.new_page()
            errors = []
            pending = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.add_init_script("""
                const originalFetch = window.fetch;
                window.fetch = function (...args) {
                    if (!window.firstGitHubRequest) {
                        window.firstGitHubRequest = {
                            contributions: document.getElementById('github-contributions').textContent,
                            repos: document.querySelectorAll('#github-repos .repo-name').length
                        };
                    }
                    return originalFetch.apply(this, args);
                };
            """)

            def respond(route):
                url = route.request.url
                if scenario in ['slow', 'file']:
                    pending.append(route)
                    return  # Keep remote requests pending: the page must already show data.
                if 'data/github.json' in url:
                    if scenario == 'bundled':
                        if url.startswith('http://127.0.0.1:'):
                            route.continue_()
                        else:
                            route.fulfill(status=404, body='{}')
                        return
                    data = dict(snapshot)
                    if scenario == 'refresh' and url.startswith('https:'):
                        data.update(contributions=1500, updated_at='2026-10-30T10:00:00Z')
                    route.fulfill(status=404 if scenario == 'unavailable' else 200,
                                  content_type='application/json', body=json.dumps(data))
                elif scenario in ['saved', 'unavailable', 'bundled']:
                    route.fulfill(status=403, body='{}')
                elif '/repos/' in url:
                    route.fulfill(json={'name': url.rsplit('/', 1)[-1],
                                        'description': '<img src=x onerror=alert(1)>', 'stargazers_count': 8})
                else:
                    route.fulfill(json={'public_repos': 21, 'followers': 9})

            page.route('https://api.github.com/**', respond)
            page.route('**/data/github.json', respond)
            url = (root / 'index.html').as_uri() if scenario == 'file' else f'http://127.0.0.1:{server.server_port}/'
            page.goto(url, wait_until='domcontentloaded')
            initial = page.evaluate('window.firstGitHubRequest')
            assert initial == {'contributions': f"{actual['contributions']:,}", 'repos': 3}, initial
            if scenario not in ['slow', 'file']:
                page.wait_for_function("/loaded|live refresh unavailable/.test(document.getElementById('github-status').textContent)")
            nav = page.locator('.nav-link').all_text_contents()
            assert nav.index('Open Source') < nav.index('Skills')
            if scenario == 'live':
                assert page.locator('#github-followers').inner_text() == '9'
                assert page.locator('#github-repositories').inner_text() == '21'
                assert page.locator('#github-contributions').inner_text() == f"{actual['contributions']:,}"
                assert page.locator('#github-repos .repo-name').all_text_contents() == ['WhatIf', 'NataBase', 'Anvil']
                assert page.locator('#open-source .sub-title').inner_text() == 'Featured Repositories'
                assert page.locator('#github-repos img').count() == 0
                assert page.locator('#github-repos .repo-desc').first.inner_text().startswith('<img')
                page.set_viewport_size({'width': 390, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            elif scenario == 'saved':
                assert page.locator('#github-followers').inner_text() == str(actual['followers'])
                assert page.locator('#github-repos .repo-name').all_text_contents() == ['WhatIf', 'NataBase', 'Anvil']
                assert 'saved GitHub data' in page.locator('#github-status').inner_text()
            elif scenario == 'bundled':
                assert page.locator('#github-contributions').inner_text() == f"{actual['contributions']:,}"
                assert page.locator('#github-repos .repo-name').all_text_contents() == ['WhatIf', 'NataBase', 'Anvil']
            elif scenario == 'refresh':
                assert page.locator('#github-contributions').inner_text() == '1,500'
            else:
                assert page.locator('#github-contributions').inner_text() == f"{actual['contributions']:,}"
                assert page.locator('#github-repos .repo-name').count() == 3
                assert 'Loading' not in page.locator('#github-status').inner_text()
            assert not errors, errors
            for route in pending:
                route.abort()
            if pending:
                page.wait_for_function("document.getElementById('github-status').textContent.includes('live refresh unavailable')")
            page.close()
            print(f'PASS: {scenario}')
        browser.close()
finally:
    server.shutdown()
