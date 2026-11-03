// Real API handlers and isolated storage; no live Supabase writes or paid services.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=process.env.CLARIO_TEST_URL||'http://127.0.0.1:5173';
const isolated=process.env.CLARIO_ISOLATED_URL||'http://127.0.0.1:8003';
const baseline=process.argv.includes('--baseline');
const evidence={phase:baseline?'before fixes':'after fixes',storage:'isolated in-memory with captured real public problem catalog',checks:[],console:[],runtimeErrors:[],requests:[],unexpectedResponses:[],browserHTTPerrors:[]};
function pass(name,details){evidence.checks.push({name,status:'PASS',details});console.log('PASS:',name);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',error=>evidence.runtimeErrors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)evidence.browserHTTPerrors.push({url:response.url(),status:response.status()});});
 page.on('console',message=>{if(['error','warning'].includes(message.type()))evidence.console.push({type:message.type(),text:message.text(),location:message.location()});});
 await page.route('**/__dev/profile',async route=>route.fulfill({response:await route.fetch({url:isolated+'/__part5/profile'})}));
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url());if(!url.pathname.startsWith('/api/'))return route.fallback();
  const response=await route.fetch({url:isolated+url.pathname+url.search});let body;try{body=await response.json();}catch{body=null;}
  evidence.requests.push({path:url.pathname,method:request.method(),status:response.status(),sent:request.postDataJSON(),received:body});
  if(response.status()>=400&&!(url.pathname==='/api/assessment/me'&&response.status()===404))evidence.unexpectedResponses.push({path:url.pathname,status:response.status()});
  return route.fulfill({response});
 });
 const get=async pathname=>{const response=await context.request.get(isolated+pathname);assert.equal(response.status(),200);return response.json();};
 async function next(){await page.getByRole('button',{name:'Continue',exact:true}).click();}
 async function choice(label){await page.locator('label').filter({has:page.locator(`input[type=radio][value="${label}"]`)}).click();}
 async function rate(language,value){const slider=page.getByRole('slider',{name:`How comfortable are you with ${language}?`,exact:true});await slider.press('Home');for(let i=1;i<value;i++)await slider.press('ArrowRight');}
 async function fill(topics){
  await page.getByRole('heading',{name:'Have you used LeetCode before?'}).waitFor();assert.equal(await page.locator('form input:checked').count(),0);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
  await choice('Yes');await next();await choice('Java');await next();
  assert.equal(await page.getByRole('slider',{name:'How comfortable are you with Python?',exact:true}).getAttribute('aria-valuetext'),'Choose a rating');
  await rate('Python',6);await rate('Java',7);await next();
  assert.equal(await page.locator('form input:checked').count(),0);for(const topic of topics)await page.getByRole('checkbox',{name:topic,exact:true}).check();await next();
  await choice('3');await next();const company=page.getByLabel('Companies (optional)');assert.equal(await company.inputValue(),'');await company.fill('Google');await next();
  const date=page.getByLabel('Next interview date',{exact:true});assert.equal(await date.inputValue(),'');assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());await date.fill(await date.getAttribute('min'));await next();
  await choice('Intermediate');await next();assert.equal(await page.locator('form input:checked').count(),0);await page.getByRole('checkbox',{name:'Math',exact:true}).check();
  await page.getByRole('button',{name:'Finish & choose an interview'}).click();await page.waitForURL(base+'/interview');
 }
 async function recommended(){await page.getByRole('button',{name:/Recommended/}).first().click();await page.waitForURL(base+'/recommended');await page.getByRole('button',{name:'Start interview',exact:true}).first().waitFor();return get('/api/recommendations');}
 try{
  assert.equal((await get('/__part5/state')).user_assessments.length,0);
  await page.goto(base+'/dashboard');await page.waitForURL(base+'/assessment');await page.getByRole('heading',{name:'Have you used LeetCode before?'}).waitFor();pass('New user Dashboard redirects to blank Assessment');
  await fill(['Hash Table','Binary Search']);const firstSaved=await get('/api/assessment/me');assert.deepEqual(firstSaved.answers.language_comfort,{python:6,java:7});assert.equal(firstSaved.answers.language,'java');pass('Assessment validates and saves; user reaches Interview Selection');
  const first=await recommended();assert.equal(first.problems.length,25);assert.equal(new Set(first.problems.map(p=>p.slug)).size,25);assert.ok(first.problems.every(p=>p.reason&&p.title&&p.difficulty&&Array.isArray(p.topics)));pass('Selection links to /recommended; 25 unique cards with reasons',{count:first.problems.length});
  const displayedTitle=await page.locator('section ul > li h2 button').first().innerText();const displayed=first.problems.find(p=>p.title===displayedTitle);assert.ok(displayed);
  await page.getByRole('button',{name:displayedTitle,exact:true}).click();await page.waitForURL(url=>url.pathname.startsWith("/interview/")&&url.searchParams.has("session"));const sessionId=new URL(page.url()).searchParams.get('session');const stored=await get('/api/sessions/'+sessionId);
  assert.equal(stored.problem_slug,displayed.slug);assert.equal(stored.language,'java');assert.equal(new URL(page.url()).searchParams.get('mode'),'recommended');
  if(baseline){evidence.checks.push({name:'Persisted recommended mode',status:stored.mode==='recommended'?'PASS':'FAIL',details:{storedMode:stored.mode,URLMode:'recommended'}});console.log('OBSERVED stored mode:',stored.mode);}else{assert.equal(stored.mode,'recommended');pass('Exact problem/Java open in Interview Room; actual session row stores recommended',{sessionId,slug:stored.problem_slug,mode:stored.mode});}
  await page.getByRole("heading",{name:displayedTitle}).first().waitFor();
  const ended=await context.request.patch(isolated+'/api/sessions/'+sessionId+'/end');assert.equal(ended.status(),200);const afterComplete=await get('/api/recommendations');assert.ok(!afterComplete.problems.some(p=>p.slug===displayed.slug));pass('Completed recommended problem is excluded');
  await page.goto(base+'/settings');await page.getByRole('button',{name:/Retake assessment/}).click();await page.getByRole('button',{name:/Let's recalibrate/}).click();await page.waitForURL(base+'/assessment');
  assert.deepEqual((await get('/api/assessment/me')).answers,firstSaved.answers);pass('Recalibrate starts blank and preserves previous saved assessment until submit');
  await fill(['Tree','Dynamic Programming']);const secondSaved=await get('/api/assessment/me');assert.equal(secondSaved.id,firstSaved.id);assert.deepEqual(secondSaved.answers.struggle_topics,['Tree','Dynamic Programming']);const second=await recommended();
  const matches=(p,topics)=>p.topics.some(t=>topics.includes(t));assert.ok(second.problems.slice(0,5).some(p=>matches(p,['Tree','Dynamic Programming'])));assert.ok(!second.problems.some(p=>p.slug===displayed.slug));pass('Recalibration replaces answers and refreshes recommendation focus',{firstFocus:firstSaved.answers.struggle_topics,secondFocus:secondSaved.answers.struggle_topics});
  await page.getByRole('link',{name:'Problem library',exact:true}).click();await page.locator('.library-recommendation').getByRole('button',{name:'Start recommended problem'}).waitFor();const featured=await page.locator('.library-recommendation h2').innerText();
  await page.getByRole('link',{name:'Interview',exact:true}).click();await page.getByRole('button',{name:/Recommended/}).first().click();await page.getByRole('button',{name:featured,exact:true}).waitFor();assert.equal(await page.locator('section ul > li h2 button').first().innerText(),featured);pass('Ducky and Recommended use the same ranked snapshot',{featured});
  await page.getByRole('link',{name:'Problem library',exact:true}).click();await page.locator('.library-recommendation').getByRole('heading',{name:featured,exact:true}).waitFor();
  const featuredProblem=second.problems.find(problem=>problem.title===featured);assert.ok(featuredProblem);
  await page.locator('.library-recommendation').getByRole('button',{name:'Start recommended problem'}).click();await page.waitForURL(url=>url.pathname.startsWith('/interview/')&&url.searchParams.has('session'));
  const featuredSession=await get('/api/sessions/'+new URL(page.url()).searchParams.get('session'));assert.equal(featuredSession.problem_slug,featuredProblem.slug);assert.equal(featuredSession.language,'java');
  if(!baseline)assert.equal(featuredSession.mode,'recommended');pass('Ducky Start opens the exact featured problem with Java and persisted recommended mode',{slug:featuredSession.problem_slug,mode:featuredSession.mode});
  assert.deepEqual(evidence.runtimeErrors,[]);assert.deepEqual(evidence.unexpectedResponses,[]);pass('No browser runtime errors or unexpected API errors',{console:evidence.console});
 }catch(error){evidence.checks.push({name:'Full flow',status:'FAIL',details:error.message});console.error(page.url(),(await page.locator('body').innerText()).slice(0,1200));throw error;}
 finally{fs.writeFileSync(path.join(__dirname,'../../docs',baseline?'cla70-baseline-flow.json':'cla70-final-flow.json'),JSON.stringify(evidence,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
