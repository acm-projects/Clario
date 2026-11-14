/* Uses fixture APIs and voice transport; never writes account data. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id:'theme-radar',email:'theme@example.test' }, profile: { id:'theme-radar',display_name:'Theme Tester',assessment_completed:true,preferred_language:'Python',starting_difficulty:'Easy',weekly_interview_goal:3 } } }));
    await page.route('**/api/sessions', route => route.fulfill({ json: [] }));
    await page.route('**/api/problems', route => route.fulfill({ json: [{slug:'two-sum',title:'Two Sum',leetcode_id:1,difficulty:'Easy',topics:['Array']}] }));
    const summary = {total_sessions:3, average_overall:62, average_by_category:{technical:81,communication:42,problem_solving:63.5},latest_overall:65,latest_session_id:'last',change_vs_first:10,umpire_miss_rate:{}};
    await page.route('**/api/progress/summary', route => route.fulfill({ json: summary }));
    await page.route('**/voice/*session*', route => route.fulfill({ status:503,json:{detail:'Voice disabled for this UI fixture'} }));
    await page.route(/\/api\/repo-challenges\/theme-fixture(?:\?.*)?$/, route => route.fulfill({ json: {id:'theme-fixture',title:'Theme repository',difficulty:'Easy',language:'python',languages:['python','cpp'],topics:['State'],category:'Debugging',estimatedMinutes:20,description:'Fixture.',objective:'Repair.',expectedBehavior:'Correct.',constraints:[],entrypoint:'main.py',files:[{path:'main.py',content:'print(1)',language:'python',readOnly:false}]} }));
    await page.goto(base);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('clario:dashboard-visited:v1:theme-radar','1'); });
    await page.goto(`${base}/repo-debugging/theme-fixture`);
    await page.getByRole('button',{name:'Dark',exact:true}).click();
    assert.equal(await page.locator('.repo-sandbox').getAttribute('data-theme'),'dark');
    assert.equal(await page.evaluate(() => localStorage.getItem('clario-settings-appearance')),null);
    await page.goto(`${base}/dashboard`);
    assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'),'light');
    const radar = page.locator('.dashboard-skills');
    await radar.getByText('81 / 100',{exact:true}).waitFor();
    assert.deepEqual(await radar.locator('dt').allTextContents(),['Technical','Communication','Reasoning']);
    assert.deepEqual(await radar.locator('dd').allTextContents(),['81 / 100','42 / 100','63.5 / 100']);
    assert.match(await radar.getByRole('img').getAttribute('aria-label'),/Technical: 81 out of 100/);
    assert.equal(await radar.locator('polygon[fill="#8bbef2"]').count(),1);
    await radar.screenshot({path:path.join(os.tmpdir(),'clario-live-skill-radar.png')});
    await page.goto(`${base}/settings`);
    await page.getByRole('radio',{name:/Dark/}).locator('..').click();
    assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'),'dark');
    await page.goto(`${base}/repo-debugging/theme-fixture`);
    await page.getByRole('button',{name:'Light',exact:true}).click();
    assert.equal(await page.locator('.repo-sandbox').getAttribute('data-theme'),'light');
    assert.equal(await page.evaluate(() => localStorage.getItem('clario-settings-appearance')),'dark');
    await page.goto(`${base}/dashboard`);
    assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'),'dark');
    await radar.getByText('81 / 100',{exact:true}).waitFor();
    console.log('PASS: sandbox theme changes stay local; Settings controls the app; radar plots real API category averages with consistent labels.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error);process.exit(1); });
