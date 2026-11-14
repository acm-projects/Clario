// Start backend/tests/part5_server.py on 8002; uses real handlers and isolated storage.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const api = process.env.CLARIO_ISOLATED_URL || 'http://127.0.0.1:8002';
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
(async()=>{
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [], writes = [];
  let assessmentReads = 0, delayRead = false, releaseRead, markRead;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/__dev/profile',async route=>route.fulfill({response:await route.fetch({url:api+'/__part5/profile'})}));
  await page.route('**/api/**',async route=>{
    const request = route.request(), url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) return route.fallback();
    if (url.pathname==='/api/assessment' && request.method()==='POST') writes.push(request.postDataJSON());
    if (url.pathname==='/api/assessment/me') {
      assessmentReads++;
      if (delayRead) {
        delayRead = false;
        const response = await route.fetch({url:api+url.pathname+url.search});
        markRead();
        await new Promise(resolve=>{releaseRead=resolve;});
        try {return await route.fulfill({response});} catch {return;}
      }
    }
    return route.fulfill({response:await route.fetch({url:api+url.pathname+url.search})});
  });
  const get = path=>fetch(api+path).then(response=>response.json());
  async function choice(name){await page.locator('label').filter({has:page.locator(`input[type=radio][value="${name}"]`)}).click();}
  async function next(){await page.getByRole('button',{name:'Continue',exact:true}).click();}
  async function blank(){
    await page.getByRole('heading',{name:'Have you used LeetCode before?'}).waitFor();
    assert.equal(await page.locator('form input:checked').count(),0);
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
  }
  async function recalibrate(){
    await page.getByRole('button',{name:/Retake assessment/}).click();
    await page.getByRole('button',{name:/Let's recalibrate/}).click();
    await page.waitForURL(base+'/assessment');await blank();
  }
  async function rate(label,value){
    const slider = page.getByRole('slider',{name:`How comfortable are you with ${label}?`,exact:true});
    await slider.press('Home');
    for(let i=1;i<value;i++) await slider.press('ArrowRight');
  }
  async function completeDraft(){
    await choice('Yes');await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await choice('Other');
    const used = page.getByLabel('Which language have you used?',{exact:true});
    assert.equal(await used.inputValue(),'');await used.fill('NewGo');await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await choice('Other');
    const custom = page.getByLabel('Your preferred programming language');
    assert.equal(await custom.inputValue(),'');await custom.fill('Kotlin');await next();
    for(const label of ['Python','Java','NewGo','Kotlin']) {
      assert.equal(await page.getByRole('slider',{name:`How comfortable are you with ${label}?`,exact:true}).getAttribute('aria-valuetext'),'Choose a rating');
    }
    assert.equal(await page.getByRole('slider',{name:'How comfortable are you with Rust?',exact:true}).count(),0);
    await rate('Python',2);await rate('Java',3);await rate('NewGo',4);await rate('Kotlin',5);await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await page.getByRole('checkbox',{name:'Tree',exact:true}).check();await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await choice('2');await next();
    const company = page.getByLabel('Companies (optional)');assert.equal(await company.inputValue(),'');await company.fill('NewCo');await next();
    const date = page.getByLabel('Next interview date',{exact:true});assert.equal(await date.inputValue(),'');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    await date.fill(today);await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await choice('Intermediate');await next();
    assert.equal(await page.locator('form input:checked').count(),0);
    await page.getByRole('checkbox',{name:'Array',exact:true}).check();
  }
  try{
    assert.equal((await get('/__part5/state')).user_assessments.length,0,'Start with a fresh isolated server');
    await page.goto(base+'/assessment');await blank();
    assert.equal(assessmentReads,0);
    await choice('No');await next();assert.equal(await page.locator('form input:checked').count(),0);
    await choice('No');await next();await choice('Python');await next();
    await rate('Python',1);await rate('Java',1);await next();
    assert.equal(await page.getByRole('slider').getAttribute('aria-valuetext'),'Choose a rating');
    assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
    console.log('PASS first-time flow, conditional questions and interview confidence start unanswered');
    const old = {experience:'intermediate', language:'python3', preferred_language:'Rust', other_language_used:'Go',
      language_comfort:{python:8,java:7,rust:9,go:6}, interview_date:today,
      has_leetcode_experience:true,has_coding_experience:null,languages_used:'other',weekly_interview_goal:5,interview_confidence:null,
      struggle_topics:['Hash Table'],confident_topics:['Tree'],companies:['OldCo']};
    const seed = await fetch(api+'/api/assessment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(old)});
    assert.equal(seed.status,200);
    const saved = await get('/api/assessment/me');
    await page.goto(base+'/settings');
    await page.getByRole('button',{name:/Retake assessment/}).click();await page.getByRole('button',{name:'Keep practicing',exact:true}).click();
    assert.deepEqual((await get('/api/assessment/me')).answers,saved.answers);
    console.log('PASS canceling Recalibrate keeps the saved assessment');
    // Hold a real saved-answer response from the previous page until after reset.
    const started = new Promise(resolve=>{markRead=resolve;});delayRead=true;
    await page.goto(base+'/recommended');await started;
    await page.getByRole('link',{name:/Settings/}).first().click();
    const readsBefore = assessmentReads;
    await recalibrate();releaseRead();
    await page.waitForTimeout(200);await blank();
    assert.equal(assessmentReads,readsBefore);
    console.log('PASS Question 1/progress reset and delayed API answers cannot refill Recalibrate');
    await completeDraft();
    assert.equal(writes.length,0);
    assert.deepEqual((await get('/api/assessment/me')).answers,saved.answers);
    console.log('PASS every choice, text field, rating, topic, date and dependent answer was blank');
    await page.getByRole('link',{name:/Settings/}).first().click();
    await page.waitForURL(base+'/settings');
    await page.getByRole('button',{name:/Retake assessment/}).waitFor();
    await page.goBack();await page.waitForURL(base+'/assessment');await blank();
    assert.deepEqual((await get('/api/assessment/me')).answers,saved.answers);
    assert.equal(writes.length,0);
    console.log('PASS leaving and returning discards the draft and preserves saved answers');
    await completeDraft();
    await page.getByRole('button',{name:'Finish & choose an interview'}).click();await page.waitForURL(base+'/interview');
    assert.equal(writes.length,1);
    const updated = await get('/api/assessment/me');
    assert.equal(updated.id,saved.id);
    assert.deepEqual(updated.answers.language_comfort,{python:2,java:3,newgo:4,kotlin:5});
    assert.equal(updated.answers.preferred_language,'Kotlin');
    assert.deepEqual(updated.answers.companies,['NewCo']);
    assert.deepEqual(updated.answers.struggle_topics,['Tree']);
    assert.deepEqual(updated.answers.confident_topics,['Array']);
    assert.equal(updated.answers.weekly_interview_goal,2);
    await page.goto(base+'/recommended');
    await page.getByRole('button',{name:'Start interview',exact:true}).first().waitFor();
    const recs = await get('/api/recommendations');
    assert.ok(recs.problems.length>=10 && recs.problems.length<=15);
    assert.ok(recs.problems[0].reason.includes('Tree'));
    console.log('PASS submission replaces saved answers and recommendations use the new topics');
    await page.goto(base+'/settings');await recalibrate();
    assert.deepEqual((await get('/api/assessment/me')).answers,updated.answers);
    console.log('PASS another Recalibrate after same-session completion starts blank');
    assert.deepEqual(errors,[]);
  }catch(error){console.error('URL:',page.url(),'Body:',await page.locator('body').innerText());throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
