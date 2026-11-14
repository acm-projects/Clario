// Real FastAPI routes and isolated in-memory storage; no live Supabase writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const api = process.env.CLARIO_ISOLATED_URL || 'http://127.0.0.1:8002';
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.route('**/__dev/profile', async route => route.fulfill({response:await route.fetch({url:api+'/__part5/profile'})}));
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return route.fallback();
    return route.fulfill({response:await route.fetch({url:api+url.pathname+url.search})});
  });
  async function next() {await page.getByRole('button',{name:'Continue',exact:true}).click();}
  async function choice(name) {await page.locator('label').filter({has:page.locator(`input[type=radio][value="${name}"]`)}).click();}
  async function rate(label, value) {
    const slider = page.getByRole('slider',{name:`How comfortable are you with ${label}?`,exact:true});
    await slider.press('Home');
    for (let i=1;i<value;i++) await slider.press('ArrowRight');
  }
  const get = path => fetch(api+path).then(response=>response.json());
  try {
    await page.goto(base+'/assessment');
    await choice('Yes'); await next();
    await choice('Other'); await page.getByLabel('Which language have you used?',{exact:true}).fill('Go'); await next();
    await choice('Other'); await page.getByLabel('Your preferred programming language').fill('C++'); await next();
    await page.getByRole('slider',{name:'How comfortable are you with Python?',exact:true}).waitFor();
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    await rate('Python',8); await rate('Java',5); await rate('Go',6);
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    await rate('C++',7);
    assert.equal(await page.getByRole('slider',{name:'How comfortable are you with Python?',exact:true}).inputValue(),'8');
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByLabel('Your preferred programming language').fill('Rust'); await next();
    assert.equal(await page.getByRole('slider',{name:'How comfortable are you with Python?',exact:true}).inputValue(),'8');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    assert.equal(await page.getByRole('slider',{name:'How comfortable are you with C++?',exact:true}).count(),0);
    await rate('Rust',9); await next();
    console.log('PASS independent Python/Java/custom ratings and custom rename reset');
    await choiceTopic('Hash Table'); await next(); await choice('3'); await next();
    await page.getByLabel('Companies (optional)').fill('Google'); await next();
    const date = page.getByLabel('Next interview date',{exact:true});
    await date.waitFor();
    const today = await date.getAttribute('min');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    await page.getByText('Enter your next interview date.',{exact:true}).waitFor();
    await date.fill('2000-01-01');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    await page.getByText('Choose today or a future interview date.',{exact:true}).waitFor();
    await date.fill(today); await next();
    await choice('Intermediate'); await next();
    await choiceTopic('Array');
    await page.getByRole('button',{name:'Finish & choose an interview'}).click(); await page.waitForURL(base+'/interview');
    const saved = await get('/api/assessment/me');
    assert.deepEqual(saved.answers.language_comfort,{python:8,java:5,go:6,rust:9});
    assert.equal(saved.answers.interview_date,today);
    assert.equal(saved.answers.language,'python3');
    assert.equal(saved.answers.preferred_language,'Rust');
    console.log('PASS required date, past rejection, today acceptance and real POST/GET round trip');
    const recommendations = await get('/api/recommendations');
    assert.ok(recommendations.has_assessment);
    assert.ok(recommendations.problems.length);
    assert.equal(recommendations.problems[0].reason,'You said you struggle with Hash Table.');
    console.log('PASS real recommendations preserve topic personalization');
    await page.goto(base+'/assessment');
    await next(); await next(); await next();
    for (const [name,value] of [['Python',8],['Java',5],['Go',6],['Rust',9]]) assert.equal(await page.getByRole('slider',{name:`How comfortable are you with ${name}?`,exact:true}).inputValue(),String(value));
    await next(); await next(); await next(); await next();
    assert.equal(await page.getByLabel('Next interview date',{exact:true}).inputValue(),today);
    console.log('PASS saved ratings and date reload on retake');
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(runtimeErrors,[]);
    console.log('PASS mobile layout and no browser runtime errors');
  } finally {await browser.close();}
  async function choiceTopic(name) {await page.getByRole('checkbox',{name,exact:true}).check();}
})().catch(error=>{console.error(error);process.exitCode=1;});
