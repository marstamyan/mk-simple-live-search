/* Real browser checks for the disposable demo site prepared under .local/. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.WP_TEST_URL || 'http://localhost:8766';
const output = path.resolve('artifacts/browser');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checks = [];
  const check = (condition, message) => { assert.ok(condition, message); checks.push(message); };
  const waitResults = async (widget, text) => {
    await widget.locator('.mk-simple-live-search-status').filter({ hasText: text }).waitFor({ state: 'attached' });
  };
  const demoPageUrl = async slug => {
    const url = new URL(base);
    url.searchParams.set('rest_route', '/wp/v2/pages');
    url.searchParams.set('slug', slug);
    const response = await page.request.get(url.toString());
    assert.equal(response.status(), 200, 'Demo page lookup succeeds.');
    const pages = await response.json();
    assert.equal(pages.length, 1, `Create the demo page with slug ${slug} first.`);
    return pages[0].link;
  };
  try {
    await page.goto(await demoPageUrl('live-search'), { waitUntil: 'networkidle' });
    const widget = page.locator('.mk-simple-live-search').first();
    const input = widget.locator('input');
    check(await page.locator('.mk-simple-live-search').count() === 1, 'Default shortcode produces one field.');
    let searches = 0;
    page.on('request', request => { if (request.url().includes('mk-simple') && request.url().includes('query=')) searches++; });
    await input.fill('ко');
    await page.waitForTimeout(550);
    check(searches === 0, 'Two characters do not send a request.');
    await input.fill('кофе');
    await waitResults(widget, /Results found:/);
    const titles = await widget.locator('a').allTextContents();
    check(titles.length >= 3, 'Cyrillic live search returns published results.');
    check(!titles.some(t => /приватная|черновик|под паролем/i.test(t)), 'Private, draft and password-protected titles are absent.');
    check(await page.evaluate(() => window.mkSimpleLiveSearch.ajax_url.includes('rest_route=')), 'Real site uses plain permalinks.');
    await input.press('ArrowDown');
    check(await widget.locator('a').first().evaluate(el => el === document.activeElement), 'Arrow Down focuses the first result.');
    await page.keyboard.press('Escape');
    check(await input.evaluate(el => el === document.activeElement), 'Escape returns focus to input.');
    check(await widget.locator('.mk-simple-live-search-results').isHidden(), 'Escape closes results.');
    await input.fill('кофе');
    await input.dispatchEvent('input');
    await waitResults(widget, /Results found:/);
    const destination = await widget.locator('a').first().getAttribute('href');
    await widget.locator('a').first().click();
    await page.waitForURL(destination);
    check(page.url() === destination, 'A result opens its real WordPress publication.');

    await page.goto(await demoPageUrl('search-modes'), { waitUntil: 'networkidle' });
    const titleWidget = page.locator('.mk-simple-live-search').nth(0);
    const contentWidget = page.locator('.mk-simple-live-search').nth(1);
    check(await page.locator('.mk-simple-live-search').count() === 2, 'Two fields initialize on one page.');
    const ids = await page.locator('.mk-simple-live-search input').evaluateAll(nodes => nodes.map(n => n.id));
    check(new Set(ids).size === 2, 'Inputs have distinct IDs in the browser.');
    await titleWidget.locator('input').fill('кофе');
    await waitResults(titleWidget, /Results found:/);
    const titleMatches = await titleWidget.locator('a').allTextContents();
    check(titleMatches.length === 3 && titleMatches.every(t => t.startsWith('кофе:')), 'Title mode matches only the three title fixtures.');
    await contentWidget.locator('input').fill('кофе');
    await waitResults(contentWidget, /Results found:/);
    const contentMatches = await contentWidget.locator('a').allTextContents();
    check(contentMatches.includes('Домашние напитки') && !contentMatches.includes('кофе: три рецепта для дома'), 'Content mode finds body-only matches and excludes title-only matches.');
    check(await titleWidget.locator('input').inputValue() === 'кофе', 'The second field preserves the first field query.');
    await page.screenshot({ path: path.join(output, 'modes-desktop.png'), fullPage: true });

    await page.goto(await demoPageUrl('search-options'), { waitUntil: 'networkidle' });
    const limited = page.locator('.mk-simple-live-search').nth(0);
    const custom = page.locator('.mk-simple-live-search').nth(1);
    await limited.locator('input').fill('кофе');
    await waitResults(limited, /Results found:/);
    check(await limited.locator('a').count() === 2, 'Custom result limit is respected.');
    await custom.locator('input').fill('кофе');
    await waitResults(custom, /Results found:/);
    check((await custom.locator('a').allTextContents()).join('|') === 'кофе: фирменный стиль', 'Public portfolio search returns only the custom post type.');
    await custom.locator('input').fill('zzznothingfoundzzz');
    await waitResults(custom, 'Nothing found.');
    check(await custom.locator('.mk-simple-no-results').isVisible(), 'No matches shows the empty state.');

    await page.route('**/*', async route => {
      if (route.request().url().includes('mk-simple') && route.request().url().includes('query=')) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Temporarily unavailable"}' });
      } else await route.continue();
    });
    await custom.locator('input').fill('кофе');
    await waitResults(custom, 'Search could not be completed.');
    check(await custom.locator('.mk-simple-error').isVisible(), 'HTTP errors display retry feedback.');
    await page.unroute('**/*');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await demoPageUrl('live-search'), { waitUntil: 'networkidle' });
    const mobile = page.locator('.mk-simple-live-search').first();
    await mobile.locator('input').fill('кофе');
    await waitResults(mobile, /Results found:/);
    const bounds = await mobile.locator('.mk-simple-live-search-results').boundingBox();
    check(bounds.x >= 0 && bounds.x + bounds.width <= 391, 'Results fit a 390px mobile viewport.');
    await page.screenshot({ path: path.join(output, 'search-mobile.png'), fullPage: true });
    check(errors.length === 0, 'No browser JavaScript errors.');
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
    console.log(`PASS: ${checks.length} real browser checks.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
