const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'paths-test', email: 'paths@example.test' }, profile: { id: 'paths-test', display_name: 'Paths Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy' } } }));
    await page.route('**/api/problems', route => route.fulfill({ json: [] }));
    await page.route('**/api/companies', route => route.fulfill({ json: ['Bumble'] }));
    await page.route('**/api/scenarios', route => route.fulfill({ json: [] }));
    await page.route('**/api/repo-challenges', route => route.fulfill({ json: [] }));
    await page.route('**/api/system-design?*', route => route.fulfill({ json: { questions: [] } }));
    await page.goto(`${base}/interview`);
    const paths = page.getByRole('region', { name: 'Interview mode selector', exact: true });
    await paths.waitFor();
    assert.deepEqual(await paths.getByRole('heading').allTextContents(), ['Coding Interview', 'Repo Debugging', 'System Design']);
    const boxes = await paths.locator('article').evaluateAll(cards => cards.map(card => { const box = card.getBoundingClientRect(); return { x: box.x, y: box.y }; }));
    assert(boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x && boxes.every(box => box.y === boxes[0].y), 'Three paths appear left to right');
    const codingTitle = await paths.getByRole('heading', { name: 'Coding Interview', exact: true }).boundingBox();
    await page.mouse.click(codingTitle.x + codingTitle.width / 2, codingTitle.y + codingTitle.height / 2);
    await page.waitForURL('**/interview?category=coding');
    const coding = page.getByRole('region', { name: 'Coding mode selector', exact: true });
    await coding.waitFor();
    assert.deepEqual(await coding.getByRole('heading').allTextContents(), ['Recommended', 'Custom', 'Surprise me', 'Company']);
    for (const [action, url] of [['Review your recommendation', '**/interview?mode=recommended'], ['Set up a surprise interview', '**/interview?mode=surprise_me'], ['Choose a company', '**/interview?mode=company'], ['Explore the library', '**/problems?choose=custom']]) {
      await coding.getByRole('button', { name: action, exact: false }).click();
      await page.waitForURL(url);
      await page.goBack();
      await coding.waitFor();
    }
    await page.getByRole('link', { name: /All interview paths/ }).click();
    await paths.getByRole('button', { name: /Choose a repository/ }).click();
    await page.waitForURL('**/interview/repo');
    await page.goBack();
    await paths.getByRole('button', { name: /Choose a company/ }).click();
    await page.waitForURL('**/system-design');
    await page.goto(`${base}/interview`);
    await page.setViewportSize({ width: 390, height: 844 });
    await paths.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No mobile overflow');
    await paths.getByRole('button', { name: /Choose a coding mode/ }).click();
    await coding.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Coding modes fit on mobile');
    console.log('PASS: three ordered paths, whole-card selection, four coding modes, every destination, back navigation, and mobile layout.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
