const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
      console.log(`Checking ${viewport.width} x ${viewport.height}`);
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(10000);
      await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'tour-test', email: 'tour@example.test' }, profile: { id: 'tour-test', display_name: 'Tour Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy', weekly_interview_goal: 3 } } }));
      await page.route('**/api/sessions', route => route.fulfill({ json: [] }));
      await page.route('**/api/problems', route => route.fulfill({ json: [] }));
      await page.route('**/api/progress/summary', route => route.fulfill({ json: { total_sessions: 0, average_by_category: {} } }));
      await page.goto(`${process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173'}/dashboard`);
      const opener = page.getByRole('button', { name: 'Quick tour', exact: true });
      await opener.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      for (let step = 0; step < 5; step++) {
        await page.waitForFunction(index => document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')?.startsWith(`Step ${index + 1}:`), step);
        const bounds = await dialog.boundingBox();
        if (process.env.TOUR_SCREENSHOTS) await page.screenshot({ path: require('node:path').join(require('node:os').tmpdir(), `tour-${viewport.width}-${step}.png`) });
        assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, `Dialog stays visible at ${viewport.width}, step ${step}`);
        const highlight = await page.locator('svg rect[stroke="#ffdf4f"]').boundingBox();
        assert(highlight && highlight.width > 0 && highlight.height > 0, 'Target has a visible highlight');
        assert(highlight.x + highlight.width <= bounds.x + 1 || highlight.x >= bounds.x + bounds.width - 1 || highlight.y + highlight.height <= bounds.y + 1 || highlight.y >= bounds.y + bounds.height - 1, 'Highlight does not overlap dialog');
        const next = dialog.getByRole('button', { name: step === 4 ? /Done/ : /Next/ });
        const nextBounds = await next.boundingBox();
        assert(nextBounds.y >= bounds.y && nextBounds.y + nextBounds.height <= bounds.y + bounds.height, 'Navigation stays visible without scrolling the tour');
        if (step === 1 && viewport.height >= 768) {
          const start = await page.locator('#dashboard-launch a[href="/interview"]').boundingBox();
          assert(start.y >= highlight.y && start.y + start.height <= highlight.y + highlight.height, 'The practice highlight includes the Start interview button');
        }
        await next.click();
      }
      await dialog.waitFor({ state: 'detached' });
      await page.waitForFunction(() => /Quick tour|Take a dashboard tour/.test(document.activeElement?.getAttribute('aria-label') || ''));
      assert.equal(await page.locator('#root').evaluate(root => root.inert), false);
      await opener.click();
      await dialog.waitFor();
      await page.keyboard.press('ArrowRight');
      await page.getByRole('heading', { name: 'Start an interview', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await opener.click();
      await dialog.waitFor();
      await page.setViewportSize({ width: 390, height: 600 });
      await dialog.getByRole('button', { name: /Next/ }).click();
      await dialog.getByRole('button', { name: 'Back', exact: true }).click();
      await dialog.getByRole('heading', { name: 'Your dashboard', exact: true }).waitFor();
      await dialog.getByRole('button', { name: 'Close dashboard tour' }).click();
      await dialog.waitFor({ state: 'detached' });
      await page.close();
    }
    console.log('PASS: tour steps, placement, finish, reopening, keyboard controls, and focus restoration on desktop and mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
