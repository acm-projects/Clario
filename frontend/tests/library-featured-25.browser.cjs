// Browser integration with mocked account/API writes; no live Supabase changes.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const top = {slug:'top-k-frequent-elements',title:'Top K Frequent Elements',difficulty:'Medium',topics:['Hash Table'],reason:'You said you struggle with Hash Table.'};
const tree = {slug:'tree-paths',title:'Tree Paths',difficulty:'Hard',topics:['Tree'],reason:'You said you struggle with Tree.'};
const recs = [top,...Array.from({length:24},(_,i)=>({...top,slug:`practice-${i}`,title:`Practice ${i}`}))];
const catalog = [
  {slug:'add-two-numbers',title:'Add Two Numbers',difficulty:'Medium',topics:['Linked List'],leetcode_id:2},
  {slug:'two-sum',title:'Two Sum',difficulty:'Easy',topics:['Array'],leetcode_id:1},
  {slug:'word-ladder',title:'Word Ladder',difficulty:'Hard',topics:['Breadth-First Search'],leetcode_id:127},
];
(async()=>{
  const browser = await chromium.launch({channel:'msedge',headless:true});
  let passed=0;
  async function scenario(name,initial,run){
    const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(10000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const state={assessed:true,assessmentStatus:200,recommendationError:false,revision:1,recs:[...recs],history:[],posts:[],recCalls:0,...initial};
    await page.route('**/__dev/profile',route=>route.fulfill({json:{user:{id:'featured-user',email:'test@example.test'},profile:{id:'featured-user',display_name:'Featured Tester',preferred_language:'Java',starting_difficulty:'Medium',assessment_completed:true}}}));
    await page.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url()),path=url.pathname;
      if(!path.startsWith('/api/'))return route.fallback();
      if(path==='/api/problems')return route.fulfill({json:catalog});
      if(path==='/api/assessment/me'){
        if(state.assessmentWait)await state.assessmentWait;
        if(!state.assessed)return route.fulfill({status:404,json:{detail:'No assessment yet'}});
        if(state.assessmentStatus!==200)return route.fulfill({status:state.assessmentStatus,json:{detail:'Could not load assessment'}});
        return route.fulfill({json:{user_id:'featured-user',updated_at:`revision-${state.revision}`,answers:{experience:'intermediate',language:'java',confident_topics:[],struggle_topics:state.revision===1?['Hash Table']:['Tree'],companies:[],interview_date:'2027-01-15',language_comfort:{python:4,java:7}}}});
      }
      if(path==='/api/recommendations'){
        assert.equal(url.searchParams.get('limit'),'25');state.recCalls++;
        if(state.recWait)await state.recWait;
        return route.fulfill({status:state.recommendationError?503:200,json:state.recommendationError?{detail:'Recommendation service unavailable'}:{has_assessment:true,problems:state.recs}});
      }
      if(path==='/api/sessions'&&request.method()==='GET')return route.fulfill({json:state.history});
      if(path==='/api/sessions'&&request.method()==='POST'){
        const body=request.postDataJSON();state.posts.push(body);
        return route.fulfill({json:{id:'featured-session',...body,status:'in_progress',started_at:new Date().toISOString(),ended_at:null}});
      }
      if(path==='/api/sessions/featured-session'){
        const chosen=state.posts.at(-1),problem=state.recs.find(item=>item.slug===chosen.problem_slug)||top;
        return route.fulfill({json:{id:'featured-session',...chosen,status:'in_progress',started_at:new Date().toISOString(),ended_at:null,latest_code:null,problem:{...problem,description_html:'<p>Practice problem</p>',starter_code:{java:'class Solution {}',python3:'class Solution: pass'},example_testcases:''}}});
      }
      return route.fulfill({json:[]});
    });
    try{await run(page,state);assert.deepEqual(errors,[]);console.log('PASS:',name);passed++;}
    catch(error){console.error('FAILED:',name,'URL:',page.url(),'Body:',(await page.locator('body').innerText()).slice(0,2000));throw error;}
    finally{await context.close();}
  }
  const banner=page=>page.locator('.library-recommendation');
  const ready=page=>banner(page).getByRole('heading',{name:top.title,exact:true}).waitFor();
  const refresh=page=>page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  try{
    await scenario('real recommendation fields and exact featured slug/saved Java launch',{},async(page,state)=>{
      await page.goto(base+'/problems');await ready(page);
      await banner(page).getByText(top.reason,{exact:true}).waitFor();
      await banner(page).getByText('Medium',{exact:true}).waitFor();
      await banner(page).getByRole('img',{name:'Clario duck walking across the blue banner'}).waitFor();
      assert.equal(await page.getByLabel('Interview language').inputValue(),'java');
      await banner(page).getByRole('button',{name:'Start recommended problem'}).click();
      await page.waitForURL('**/interview/top-k-frequent-elements?session=featured-session&mode=recommended');
      assert.deepEqual(state.posts,[{problem_slug:top.slug,mode:'practice',language:'java'}]);
    });
    await scenario('manual interview-language selection survives asynchronous saved-language loading',{},async(page,state)=>{
      let release;state.assessmentWait=new Promise(resolve=>{release=resolve;});
      await page.goto(base+'/problems');
      await banner(page).getByRole('heading',{name:'Finding your next challenge...'}).waitFor();
      assert.equal(await banner(page).getByText('Add Two Numbers',{exact:true}).count(),0);
      await page.getByLabel('Interview language').selectOption('python3');release();state.assessmentWait=null;await ready(page);
      assert.equal(await page.getByLabel('Interview language').inputValue(),'python3');
      await banner(page).getByRole('button',{name:'Start recommended problem'}).click();
      await page.waitForURL('**/interview/top-k-frequent-elements?session=featured-session&mode=recommended');
      assert.equal(state.posts[0].language,'python3');
    });
    await scenario('banner and Recommended page share the same current 25-problem snapshot',{},async(page,state)=>{
      await page.goto(base+'/problems');await ready(page);assert.equal(state.recCalls,1);
      await page.getByRole('link',{name:'Interview',exact:true}).click();
      await page.getByRole('button',{name:/Recommended/}).first().click();await page.waitForURL(base+'/recommended');
      await page.getByRole('button',{name:top.title,exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Start interview',exact:true}).count(),25);
      assert.equal(state.recCalls,1,'Same revision reuses the backend-ranked list across pages');
    });
    await scenario('recalibration revision invalidates old pick on focus',{},async(page,state)=>{
      await page.goto(base+'/problems');await ready(page);
      state.revision=2;state.recs=[tree,...recs.slice(1)];await refresh(page);
      await banner(page).getByRole('heading',{name:tree.title,exact:true}).waitFor();
      await banner(page).getByText(tree.reason,{exact:true}).waitFor();
      await banner(page).getByText('Hard',{exact:true}).waitFor();
      assert.equal(state.recCalls,2);
    });
    await scenario('completed featured problem invalidates snapshot and advances to next eligible pick',{},async(page,state)=>{
      await page.goto(base+'/problems');await ready(page);
      state.history=[{id:'completed-featured',status:'completed',problem_slug:top.slug}];state.recs=recs.slice(1);await refresh(page);
      await banner(page).getByRole('heading',{name:recs[1].title,exact:true}).waitFor();
      assert.equal(await banner(page).getByRole('heading',{name:top.title,exact:true}).count(),0);assert.equal(state.recCalls,2);
    });
    await scenario('day rollover refreshes difficulty instead of keeping a cached pick',{},async(page,state)=>{
      await page.clock.install({time:new Date('2026-11-02T18:00:00Z')});
      await page.goto(base+'/problems');await ready(page);
      state.recs=[tree,...recs.slice(1)];
      await page.clock.setSystemTime(new Date('2026-11-03T18:00:00Z'));await refresh(page);
      await banner(page).getByRole('heading',{name:tree.title,exact:true}).waitFor();assert.equal(state.recCalls,2);
    });
    await scenario('snapshot expires within a minute even when assessment and history are unchanged',{},async(page,state)=>{
      await page.clock.install({time:new Date('2026-11-02T18:00:00Z')});
      await page.goto(base+'/problems');await ready(page);
      state.recs=[tree,...recs.slice(1)];
      await page.clock.setSystemTime(new Date('2026-11-02T18:01:01Z'));await refresh(page);
      await banner(page).getByRole('heading',{name:tree.title,exact:true}).waitFor();assert.equal(state.recCalls,2);
    });
    await scenario('missing assessment offers assessment link while public library remains usable',{assessed:false},async(page,state)=>{
      await page.goto(base+'/problems');
      const link=banner(page).getByRole('link',{name:'Complete assessment'});await link.waitFor();assert.equal(await link.getAttribute('href'),'/assessment');assert.equal(state.recCalls,0);
      await page.getByRole('searchbox',{name:'Search problems'}).fill('two');
      await page.getByRole('group',{name:'Filter by difficulty'}).getByRole('button',{name:'Medium',exact:true}).click();
      await page.getByRole('button',{name:'Open Add Two Numbers',exact:true}).waitFor();
      assert.equal(await page.locator('.library-problem-action').count(),1);
      await page.getByRole('button',{name:'Clear filters',exact:true}).click();
      await page.getByRole('button',{name:'Topics',exact:false}).click();
      await page.locator('#library-topic-filters select').first().selectOption('Linked List');
      assert.equal(await page.locator('.library-problem-action').count(),1);
      await link.click();await page.waitForURL(base+'/assessment');
      await page.getByRole('heading',{name:'Have you used LeetCode before?'}).waitFor();
    });
    await scenario('recommendation error offers retry and never falls back to library Medium',{recommendationError:true},async(page,state)=>{
      await page.goto(base+'/problems');await banner(page).getByText('Recommendation service unavailable',{exact:true}).waitFor();
      assert.equal(await banner(page).getByRole('heading',{name:'Add Two Numbers',exact:true}).count(),0);
      state.recommendationError=false;await banner(page).getByRole('button',{name:'Try again',exact:true}).click();await ready(page);
    });
    await scenario('invalid recommendation identifier is rejected without launching a session',{recs:[{...top,slug:''}]},async(page,state)=>{
      await page.goto(base+'/problems');await banner(page).getByRole('heading',{name:'We could not load your pick'}).waitFor();
      assert.equal(await banner(page).getByRole('button',{name:'Start recommended problem'}).count(),0);assert.equal(state.posts.length,0);
    });
    await scenario('empty recommendation list has a friendly empty banner',{recs:[]},async page=>{
      await page.goto(base+'/problems');await banner(page).getByRole('heading',{name:'You are all caught up'}).waitFor();
      assert.equal(await banner(page).getByRole('button',{name:'Start recommended problem'}).count(),0);
      assert.equal(await page.locator('.library-problem-action').count(),3);
      await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    });
    console.log(`${passed} featured-library browser scenarios passed`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
