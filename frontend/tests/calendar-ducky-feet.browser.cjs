// All account/API writes are mocked. Calendar data comes from session fixtures, not invented UI counters.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const os=require('node:os');const path=require('node:path');
const base=process.env.CLARIO_TEST_URL||'http://127.0.0.1:5173';
const fixed=new Date('2026-11-03T18:00:00Z');
const session=(id,day,hour=12,status='completed')=>({id,problem_slug:`practice-${id}`,status,ended_at:status==='in_progress'?null:`${day}T${String(hour).padStart(2,'0')}:00:00Z`,started_at:`${day}T07:00:00Z`,mode:'recommended',language:'java'});
const todaySessions=Array.from({length:8},(_,i)=>session(`today-${i}`,'2026-11-03',8+i));
const activeRows=[session('nov1','2026-11-01'),session('nov2','2026-11-02'),...todaySessions,session('future','2026-11-03',20),session('failed','2026-11-03',10,'failed'),session('running','2026-11-03',10,'in_progress')];
function feedback(row,available){return {session:row,problem:{title:row.problem_slug.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' '),difficulty:'Medium'},feedback:available?{id:`report-${row.id}`,report:{summary:'Saved calendar feedback.'},strengths:[],weaknesses:[],recommendations:[]}:null};}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let passed=0;
 async function scenario(name,initial,run,options={}){
  const context=await browser.newContext(options);const page=await context.newPage();page.setDefaultTimeout(10000);await page.clock.install({time:fixed});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const state={rows:[...activeRows],feedbackError:false,sessionsError:false,feedbackCalls:0,sessionCalls:0,delayNextFeedback:false,...initial};
  await page.addInitScript(({dark})=>{localStorage.setItem('clario:dashboard-tour:v1:calendar-user','done');if(dark)localStorage.setItem('clario-settings-appearance','dark');},{dark:initial.dark||false});
  await page.route('**/__dev/profile',route=>route.fulfill({json:{user:{id:'calendar-user',email:'test@example.test'},profile:{id:'calendar-user',display_name:'Calendar Tester',preferred_language:'Java',starting_difficulty:'Medium',assessment_completed:true,weekly_interview_goal:3}}}));
  await page.route('**/api/**',async route=>{
   const url=new URL(route.request().url());if(!url.pathname.startsWith('/api/'))return route.fallback();
   if(url.pathname==='/api/assessment/me')return route.fulfill({json:{user_id:'calendar-user',updated_at:'test',answers:{experience:'intermediate',language:'java',companies:[],struggle_topics:['Array'],confident_topics:[]}}});
   if(url.pathname==='/api/problems')return route.fulfill({json:[{slug:'two-sum',title:'Two Sum',difficulty:'Medium',topics:['Array'],leetcode_id:1}]});
   if(url.pathname==='/api/sessions'){state.sessionCalls++;return route.fulfill({status:state.sessionsError?503:200,json:state.sessionsError?{detail:'History unavailable'}:state.rows});}
   if(url.pathname==='/api/feedback'){
    state.feedbackCalls++;
    if(state.delayNextFeedback){state.delayNextFeedback=false;state.feedbackStarted?.();await new Promise(resolve=>{state.releaseFeedback=resolve;});}
    return route.fulfill({status:state.feedbackError?503:200,json:state.feedbackError?{detail:'Reports unavailable'}:state.rows.filter(r=>r.status==='completed'&&r.ended_at<=fixed.toISOString()).map(row=>feedback(row,['today-0','today-7','nov2'].includes(row.id)))}).catch(()=>{});
   }
   if(url.pathname.startsWith('/api/feedback/'))return route.fulfill({json:feedback(state.rows.find(row=>row.id===url.pathname.split('/').at(-1)),true)});
   return route.fulfill({json:[]});
  });
  try{await run(page,state);assert.deepEqual(errors,[]);passed++;console.log('PASS:',name);}
  catch(error){console.error('FAILED:',name,'URL:',page.url(),'Body:',(await page.locator('body').innerText()).slice(-2800));throw error;}
  finally{await context.close();}
 }
 const calendar=page=>page.getByRole('region',{name:'Interview Calendar',exact:true});
 const day=(page,number,count)=>calendar(page).getByRole('button',{name:new RegExp(`November 2026 ${number}: ${count} completed`)});
 const refresh=page=>page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 async function open(page){await page.goto(base+'/dashboard');await calendar(page).getByRole('progressbar').waitFor();}
 const details=page=>page.locator('#calendar-day-details');
 try{
  await scenario('only genuine completed dates get two connected SVG legs and webbed paddles, with cream backgrounds and readable numbers',{},async page=>{
   await open(page);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.calendar-completed-day .calendar-day-number')).color==='rgb(24, 33, 55)');const group=calendar(page).getByRole('group',{name:'November 2026 interview activity'});
   assert.equal(await group.locator('.calendar-completed-day').count(),3);assert.equal(await group.locator('[data-ducky-footsteps]').count(),3);
   for(const button of await group.locator('.calendar-completed-day').all()){
    assert.equal(await button.locator('.ducky-feet path').count(),2);
    for(const paddle of await button.locator('.ducky-foot path').all()) assert.ok((await paddle.getAttribute('d')).includes('8.5 3.2L9.5 10.7'),'Connected bent leg continues into webbed paddle');
    assert.equal(await button.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await button.locator('.calendar-day-number').evaluate(node=>getComputedStyle(node).color),'rgb(24, 33, 55)');
    const number=await button.locator('.calendar-day-number').boundingBox(),feet=await button.locator('.ducky-feet').boundingBox();assert.ok(number.y+number.height<=feet.y+2,'Date sits above the feet');
   }
   assert.equal(await group.locator('button:not(.calendar-completed-day) .ducky-feet').count(),0);
   assert.equal(await day(page,3,8).getAttribute('aria-current'),'date');
   await day(page,3,8).scrollIntoViewIfNeeded();const before=await day(page,3,8).boundingBox();await day(page,3,8).hover();
   assert.equal(await day(page,3,8).locator('.ducky-hover-pair').evaluate(node=>getComputedStyle(node).animationName),'ducky-wiggle');
   assert.deepEqual(await day(page,3,8).boundingBox(),before,'Wiggle never shifts cells');
   await page.waitForTimeout(1000);await calendar(page).screenshot({path:path.join(os.tmpdir(),'clario-ducky-feet-desktop.png')});
  });
  await scenario('left and right feet step once, with short chronological delays across consecutive days',{},async page=>{
   await open(page);
   const left1=day(page,1,1).locator('.ducky-foot--left'),right1=day(page,1,1).locator('.ducky-foot--right');
   assert.equal(await left1.evaluate(node=>getComputedStyle(node).animationName),'ducky-step-left');assert.equal(await right1.evaluate(node=>getComputedStyle(node).animationName),'ducky-step-right');
   assert.equal(await left1.evaluate(node=>getComputedStyle(node).animationIterationCount),'1');assert.equal(await right1.evaluate(node=>getComputedStyle(node).animationIterationCount),'1');
   assert.ok(parseFloat(await right1.evaluate(node=>getComputedStyle(node).animationDelay))>parseFloat(await left1.evaluate(node=>getComputedStyle(node).animationDelay)));
   assert.ok(parseFloat(await day(page,2,1).locator('.ducky-foot--left').evaluate(node=>getComputedStyle(node).animationDelay))>parseFloat(await left1.evaluate(node=>getComputedStyle(node).animationDelay)));
  });
  await scenario('month navigation replays a single waddle on each month visit',{},async page=>{
   await open(page);await calendar(page).getByRole('button',{name:'Previous month'}).click();assert.equal(await calendar(page).getByRole('group').locator('.ducky-feet').count(),0);
   await calendar(page).getByRole('button',{name:'Next month'}).click();assert.equal(await calendar(page).getByRole('group').locator('[data-stepping="true"]').count(),3);
   await refresh(page);await calendar(page).getByRole('progressbar').waitFor();assert.equal(await calendar(page).getByRole('group').locator('[data-stepping="true"]').count(),3);
   assert.equal(await calendar(page).getByRole('progressbar').getAttribute('aria-valuenow'),'3');
  });
  await scenario('a refreshed completion appears with the same connected leg design',{rows:[session('nov1','2026-11-01'),session('nov2','2026-11-02')]},async(page,state)=>{
   await open(page);state.rows.push(session('nov3','2026-11-03'));await refresh(page);await day(page,3,1).locator('.ducky-feet').waitFor();
   assert.equal(await day(page,3,1).locator('.ducky-feet').getAttribute('data-stepping'),'true');assert.equal(await day(page,2,1).locator('.ducky-feet').getAttribute('data-stepping'),'true');
  });
  await scenario('completed dates remain keyboard clickable and feedback links still work',{},async page=>{
   await open(page);await day(page,3,8).focus();await page.keyboard.press('Enter');await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).waitFor();
   assert.equal(await details(page).locator('li').count(),8);await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).click();await page.waitForURL(base+'/report/today-0');await page.getByText('Saved calendar feedback.',{exact:true}).waitFor();
  });
  await scenario('reduced-motion users see static feet with readable dates',{},async page=>{
   await open(page);for(const foot of await calendar(page).getByRole('group').locator('.ducky-foot').all())assert.equal(await foot.evaluate(node=>getComputedStyle(node).animationName),'none');
   assert.equal(await calendar(page).getByRole('group').locator('.ducky-feet').count(),3);
   await day(page,3,8).hover();assert.equal(await day(page,3,8).locator('.ducky-hover-pair').evaluate(node=>getComputedStyle(node).animationName),'none');
  },{reducedMotion:'reduce'});
  await scenario('feet and dates fit at 320px in dark mode without a blue fill or overflow',{dark:true},async page=>{
   await page.setViewportSize({width:320,height:844});await open(page);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.calendar-completed-day .calendar-day-number')).color==='rgb(237, 241, 251)');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await day(page,3,8).evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await day(page,3,8).locator('.calendar-day-number').evaluate(node=>getComputedStyle(node).color),'rgb(237, 241, 251)');
   await page.waitForTimeout(1000);await calendar(page).screenshot({path:path.join(os.tmpdir(),'clario-ducky-feet-mobile.png')});
  });
  await scenario('empty and future-only activity never displays footprints on dates',{rows:[session('future','2026-11-03',20),session('failed','2026-11-03',12,'failed')]},async page=>{
   await open(page);assert.equal(await calendar(page).getByRole('group').locator('.ducky-feet').count(),0);assert.equal(await calendar(page).getByRole('progressbar').getAttribute('aria-valuenow'),'0');
  });
  console.log(`${passed} Ducky feet browser scenarios passed`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
