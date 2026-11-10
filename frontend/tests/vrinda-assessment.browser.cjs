const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const isolated=process.env.CLARIO_ASSESSMENT_API;
const base=process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5180';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage();let saved;
 await page.route('**/__dev/profile',async r=>isolated ? r.fulfill({response:await r.fetch({url:isolated+'/__part5/profile'})}) : r.fulfill({json:{user:{id:'assessment-test'},profile:{id:'assessment-test',assessment_completed:false,preferred_language:'Java'}}}));
 await page.route('**/api/assessment',async r=>{saved=r.request().postDataJSON();if(isolated) return r.fulfill({response:await r.fetch({url:isolated+'/api/assessment'})});return r.fulfill({json:{user_id:'assessment-test',answers:saved,updated_at:new Date().toISOString()}})});
 await page.goto(base+'/assessment');
 const next=()=>page.getByRole('button',{name:'Continue',exact:true}).click();
 const choice=value=>page.locator('label').filter({has:page.locator(`input[type="radio"][value="${value}"]`)}).click();
 await page.getByRole('heading',{name:'Have you used LeetCode before?'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled(),true);
 await choice('Yes');await next();await choice('Java');await next();
 for(const label of ['Python','Java']) await page.getByRole('slider',{name:`How comfortable are you with ${label}?`,exact:true}).press('End');
 await next();await page.getByRole('checkbox',{name:'Hash Table',exact:true}).check();await next();
 await choice('3');await next();
 await page.getByLabel('Companies (optional)',{exact:true}).fill('Stripe, Google');await next();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
 await page.getByLabel('Next interview date',{exact:true}).fill(today);await next();
 await choice('Intermediate');await next();await page.getByRole('checkbox',{name:'Array',exact:true}).check();
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByRole('button',{name:/Finish & choose an interview/}).click();await page.waitForURL('**/interview');
 assert.equal(saved.language,'java');assert.deepEqual(saved.language_comfort,{python:10,java:10});
 assert.deepEqual(saved.struggle_topics,['Hash Table']);assert.deepEqual(saved.confident_topics,['Array']);
 assert.deepEqual(saved.companies,['Stripe','Google']);assert.equal(saved.interview_date,today);
 if(isolated) {
 const stored=await page.request.get(isolated+'/api/assessment/me');assert.equal(stored.status(),200);
 const row=await stored.json();assert.equal(row.answers.language,'java');assert.deepEqual(row.answers.companies,['Stripe','Google']);assert.deepEqual(row.answers.language_comfort,{python:10,java:10});assert.equal(row.answers.interview_date,today);
 const response=await page.request.get(isolated+'/api/recommendations?limit=25');assert.equal(response.status(),200);const result=await response.json();assert.equal(result.has_assessment,true);assert.ok(result.problems.length>0);assert.ok(result.problems.some(item=>item.reason.includes('Hash Table')));
 console.log('Verified real FastAPI POST, persisted answers via GET, and personalized recommendations using isolated storage.');
 }
 console.log('Passed: complete Vrinda assessment, validation, ratings, topics, companies, date, mocked save, navigation, mobile fit.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
