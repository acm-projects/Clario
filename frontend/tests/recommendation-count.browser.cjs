// Run against the existing local development server. All account/API writes are mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Chicago'}).format(new Date());
const answers = { experience: 'intermediate', confident_topics: ['Array'], struggle_topics: ['Hash Table'], companies: ['Google'], language: 'java', preferred_language: 'Java', other_language_used: null, language_comfort: {python:1,java:1}, interview_date:today, has_leetcode_experience:true, has_coding_experience:null, languages_used:'Java', weekly_interview_goal:3, interview_confidence:null };
const problem = { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array', 'Hash Table'], reason: 'You said you struggle with Hash Table.' };
const detail = { ...problem, leetcode_id: 1, description_html: '<p>Find two numbers.</p>', starter_code: { python3: 'class Solution: pass', java: 'class Solution {}' }, example_testcases: '[2,7]\n9' };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let passed = 0;
  async function scenario(name, initial, run) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => console.error('Browser error:', error.message));
    const state = { assessed: true, assessmentError: null, recommendationError: false, problems: [problem], submitFailures: 0, posts: [], sessions: [], ...initial };
    const saved = () => ({ user_id: 'part4-test-user', updated_at: '2026-10-30T12:00:00Z', answers: state.answers || answers });
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'part4-test-user', email: 'test@example.test' }, profile: { id: 'part4-test-user', display_name: 'Part Four', preferred_language: 'Python', starting_difficulty: 'Easy', assessment_completed: true, weekly_interview_goal: 3 } } }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (!path.startsWith('/api/')) return route.fallback();
      if (path === '/api/assessment/me') {
        if (state.assessmentWait) await state.assessmentWait;
        if (state.assessmentError === 'network') return route.abort();
        if (state.assessmentError) return route.fulfill({ status: state.assessmentError, json: { detail: 'Assessment check failed' } });
        return route.fulfill({ status: state.assessed ? 200 : 404, json: state.assessed ? saved() : { detail: 'No assessment yet' } });
      }
      if (path === '/api/assessment' && request.method() === 'POST') {
        state.posts.push(request.postDataJSON());
        if (state.submitWait) await state.submitWait;
        if (state.submitFailures-- > 0) return route.fulfill({ status: 503, json: { detail: 'Please retry saving' } });
        state.assessed = true; state.answers = request.postDataJSON();
        return route.fulfill({ json: saved() });
      }
      if (path === '/api/recommendations') {
        assert.equal(new URL(request.url()).searchParams.get('limit'), '15');
        if (state.recommendationWait) await state.recommendationWait;
        return route.fulfill({ status: state.recommendationError ? 503 : 200, json: state.recommendationError ? { detail: 'Recommendation service unavailable' } : { has_assessment: state.assessed, problems: state.problems } });
      }
      if (path === '/api/sessions' && request.method() === 'POST') {
        state.sessions.push(request.postDataJSON());
        if (state.sessionFailure) return route.fulfill({ status: 503, json: { detail: 'Could not start interview' } });
        return route.fulfill({ json: { id: 'part4-session', ...request.postDataJSON(), status: 'in_progress', started_at: new Date().toISOString(), ended_at: null } });
      }
      if (path === '/api/sessions/part4-session') return route.fulfill({ json: { id: 'part4-session', mode: 'practice', problem_slug: problem.slug, language: 'java', status: 'in_progress', started_at: new Date().toISOString(), ended_at: null, problem: detail, latest_code: null } });
      return route.fulfill({ json: path === '/api/problems/two-sum' ? detail : [] });
    });
    try { await run(page, state); passed++; console.log('PASS:', name); }
    catch (error) { console.error('Scenario:', name, 'URL:', page.url(), 'Body:', await page.evaluate(() => document.body?.innerText.slice(0, 1600))); throw error; }
    finally { await context.close(); }
  }
  async function waitText(page, text) { await page.getByText(text, { exact: true }).first().waitFor(); }
  async function continueForm(page) { await page.getByRole('button', { name: 'Continue', exact: true }).click(); }

  const fifteen = [...Array.from({length:14},(_,i)=>({...problem,slug:`candidate-${i}`,title:`Candidate ${i}`,difficulty:'Medium'})),problem];
  try {
    await scenario('requests 15, renders all cards and opens the fifteenth problem', {problems:fifteen}, async(page,state)=>{
      await page.goto(base+'/recommended');
      await page.getByRole('button',{name:'Two Sum',exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Start interview',exact:true}).count(),15);
      assert.equal(await page.locator('section ul > li').count(),15);
      await page.getByText('15 recommended problems',{exact:true}).waitFor();
      for (const item of fifteen) {
        const card = page.locator('section ul > li').filter({has:page.getByRole('button',{name:item.title,exact:true})});
        assert.equal(await card.count(),1);
        await card.getByText(item.difficulty,{exact:true}).waitFor();
        await card.getByText(item.reason,{exact:true}).waitFor();
        await card.getByText('Hash Table',{exact:true}).waitFor();
      }
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.getByRole('button',{name:'Two Sum',exact:true}).click();
      await page.waitForURL('**/interview/two-sum?session=part4-session&mode=recommended');
      assert.equal(state.sessions[0].problem_slug,'two-sum');
      assert.equal(state.sessions[0].language,'java');
    });
    await scenario('10-14 cards remain complete and do not show a shortfall warning', {problems:fifteen.slice(0,12)}, async(page)=>{
      await page.goto(base+'/recommended');
      await page.getByText('12 recommended problems',{exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Start interview',exact:true}).count(),12);
      assert.equal(await page.getByText(/Only .* suitable/).count(),0);
    });
    await scenario('a small pool displays the backend shortfall explanation with unique cards', {problems:fifteen.slice(0,3)}, async(page)=>{
      await page.route('**/api/recommendations?limit=15',route=>route.fulfill({json:{has_assessment:true,problems:fifteen.slice(0,3),target_count:15,minimum_count:10,eligible_count:3,shortfall_message:'Only 3 unique, uncompleted problems suitable for your practice level are available. Completed problems and unsuitable difficulty levels are excluded.'}}));
      await page.goto(base+'/recommended');
      await page.getByRole('status').filter({hasText:'Only 3 unique'}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Start interview',exact:true}).count(),3);
      assert.equal(new Set(await page.locator('section ul > li h2').allTextContents()).size,3);
    });
    await scenario('empty pool displays the shortfall explanation and library link', {problems:[]}, async(page)=>{
      await page.goto(base+'/recommended');
      await page.getByRole('heading',{name:/all caught up/}).waitFor();
      await page.getByText(/Only 0 suitable, uncompleted problems/).waitFor();
      await page.getByRole('link',{name:'Browse problems'}).waitFor();
    });
    console.log(`${passed} recommendation count browser scenarios passed`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
