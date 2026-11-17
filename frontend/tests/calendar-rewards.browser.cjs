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
  await scenario('actual completed days, icons, milestone progress, all day interviews and saved report links',{},async(page,state)=>{
   await open(page);const card=calendar(page);
   await card.getByText('Continued today',{exact:true}).waitFor();assert.equal(await card.getByRole('progressbar').getAttribute('aria-valuenow'),'3');assert.equal(await card.getByRole('progressbar').getAttribute('aria-valuemax'),'7');
   assert.equal(await card.locator('[data-streak-milestone]').count(),0);assert.equal(state.feedbackCalls,0);
   assert.ok(await day(page,3,8).locator('svg').count());
   await day(page,3,8).focus();await page.keyboard.press('Enter');
   await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).waitFor();
   assert.equal(await details(page).locator('li').count(),8);
   assert.equal(await details(page).getByRole('link',{name:/View feedback/}).count(),2);
   assert.equal(await details(page).getByText('Feedback pending',{exact:true}).count(),6);
   assert.equal(await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).getAttribute('href'),'/report/today-0');
   assert.ok((await card.innerText()).includes('4 more days'));
   await card.screenshot({path:path.join(os.tmpdir(),'clario-calendar-desktop.png')});
   await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).click();await page.waitForURL(base+'/report/today-0');await page.getByText('Saved calendar feedback.',{exact:true}).waitFor();
  });
  await scenario('empty activity has honest encouragement and no invented milestone',{rows:[]},async(page,state)=>{
   await open(page);await calendar(page).getByText(/Your first completed interview starts your streak/).waitFor();assert.equal(await calendar(page).getByRole('progressbar').getAttribute('aria-valuenow'),'0');
   await calendar(page).getByRole('button',{name:'Today',exact:true}).click();await details(page).getByText('No completed interviews on this day.',{exact:true}).waitFor();assert.equal(state.feedbackCalls,0);
  });
  await scenario('yesterday remains alive with an explicit continue-today label',{rows:['2026-10-31','2026-11-01','2026-11-02'].map((date,i)=>session(`y-${i}`,date))},async page=>{
   await open(page);await calendar(page).getByText('Continue today',{exact:true}).waitFor();await calendar(page).getByText(/Your 3-day streak is still going/).waitFor();assert.equal(await calendar(page).getByRole('progressbar').getAttribute('aria-valuenow'),'3');
  });
  await scenario('a gap resets the current streak but preserves the longest record',{rows:['2026-10-29','2026-10-30','2026-10-31'].map((date,i)=>session(`old-${i}`,date))},async page=>{
   await open(page);await calendar(page).getByText('Start a fresh streak',{exact:true}).waitFor();assert.equal(await calendar(page).getByRole('progressbar').getAttribute('aria-valuenow'),'0');await calendar(page).getByText(/practiced on 3 different days/).waitFor();
  });
  await scenario('new 3/7-day milestones celebrate once and survive same-data refresh',{rows:[session('nov1','2026-11-01'),session('nov2','2026-11-02')]},async(page,state)=>{
   await open(page);assert.equal(await calendar(page).locator('[data-streak-milestone]').count(),0);
   state.rows.push(session('nov3','2026-11-03'));await refresh(page);await calendar(page).locator('[data-streak-milestone="3"]').waitFor();
   assert.equal(await calendar(page).locator('[data-streak-milestone="3"]').evaluate(node=>getComputedStyle(node).animationName),'calendar-milestone-pop');
   await page.clock.runFor(4200);assert.equal(await calendar(page).locator('[data-streak-milestone]').count(),0);
   await refresh(page);await calendar(page).getByRole('progressbar').waitFor();assert.equal(await calendar(page).locator('[data-streak-milestone]').count(),0);
   for(const date of ['2026-10-28','2026-10-29','2026-10-30','2026-10-31'])state.rows.push(session(`added-${date}`,date));await refresh(page);await calendar(page).locator('[data-streak-milestone="7"]').waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('clario:streak-milestones:v1:calendar-user')),'7');
  });
  await scenario('reduced motion keeps celebration text but disables animation',{rows:[session('nov1','2026-11-01'),session('nov2','2026-11-02')],dark:true},async(page,state)=>{
   await open(page);state.rows.push(session('nov3','2026-11-03'));await refresh(page);const notice=calendar(page).locator('[data-streak-milestone="3"]');await notice.waitFor();
   assert.equal(await notice.evaluate(node=>getComputedStyle(node).animationName),'none');assert.equal(await notice.evaluate(node=>getComputedStyle(node).color),'rgb(24, 33, 55)');
  },{reducedMotion:'reduce'});
  await scenario('report failures can be retried without hiding completed interviews',{feedbackError:true},async(page,state)=>{
   await open(page);await day(page,3,8).click();await details(page).getByRole('button',{name:'Retry reports',exact:true}).waitFor();assert.equal(await details(page).locator('li').count(),8);assert.equal(await details(page).getByRole('link').count(),0);
   state.feedbackError=false;await details(page).getByRole('button',{name:'Retry reports',exact:true}).click();await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).waitFor();
  });
  await scenario('changing days ignores a late report response and month navigation clears details',{},async(page,state)=>{
   await open(page);const started=new Promise(resolve=>{state.feedbackStarted=resolve;});state.delayNextFeedback=true;await day(page,3,8).click();await started;
   await day(page,2,1).click();await details(page).getByRole('link',{name:'View feedback for Practice Nov2',exact:true}).waitFor();state.releaseFeedback();await page.clock.runFor(200);
   assert.equal(await details(page).locator('li').count(),1);assert.equal(await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).count(),0);
   await calendar(page).getByRole('button',{name:'Previous month'}).click();assert.equal(await details(page).count(),0);await calendar(page).getByRole('button',{name:'Today',exact:true}).click();await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).waitFor();
  });
  await scenario('mobile calendar and day details fit at 320px without horizontal scrolling',{},async page=>{
   await page.setViewportSize({width:320,height:844});await open(page);await day(page,3,8).click();await details(page).getByRole('link',{name:'View feedback for Practice Today 0',exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await calendar(page).screenshot({path:path.join(os.tmpdir(),'clario-calendar-mobile.png')});
  });
  await scenario('unavailable history never claims fake streaks or achievements',{sessionsError:true},async(page,state)=>{
   await page.goto(base+'/dashboard');await calendar(page).getByText(/Interview activity is unavailable/).waitFor();assert.equal(await calendar(page).getByRole('progressbar').count(),0);assert.equal(await calendar(page).locator('[data-streak-milestone]').count(),0);
   state.sessionsError=false;await page.locator('#dashboard-calendar').getByRole('button',{name:'Retry',exact:true}).click();await calendar(page).getByRole('progressbar').waitFor();
  });
  console.log(`${passed} calendar browser scenarios passed`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
