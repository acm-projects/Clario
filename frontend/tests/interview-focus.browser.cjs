const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 try {
 const context = await browser.newContext({permissions:['microphone','camera']});
 const page = await context.newPage();
 let profiles = 0;
 await page.route('**/__dev/profile', r => { profiles++; return r.fulfill({json:{user:{id:'local-test'},profile:{id:'local-test',assessment_completed:true}}}); });
 await page.route('**/node_modules/.vite/deps/@elevenlabs_client.js*', r => r.fulfill({contentType:'application/javascript',body:`export const Conversation={startSession:async options=>{window.starts=(window.starts||0)+1;window.cues=[];window.voice=options;options.onModeChange({mode:'listening'});return {sendContextualUpdate(){},sendUserMessage(text){window.cues.push(text)},endSession:async()=>{},getInputVolume:()=>0}}};`}));
 await page.route('**/voice/*session*',r=>r.fulfill({json:{signed_url:'wss://example.test',variables:{problem_title:'Example',problem_description:'Fix this.',repo_name:'Example',bug_summary:'Fix this.',root_cause:'private'}}}));
 await page.route('**/api/repo-challenges/example?*',r=>r.fulfill({json:{id:'example',title:'Example repository',difficulty:'Easy',language:'python',estimatedMinutes:20,description:'Fix this.',objective:'Fix it.',expectedBehavior:'Correct result.',constraints:[],entrypoint:'main.py',files:[{path:'main.py',content:'print(1)',language:'python',readOnly:false}]}}));
 await page.clock.install();
 await page.goto((process.env.CLARIO_TEST_URL||'http://127.0.0.1:5179')+'/interview/repo/example');
 await page.getByRole('dialog').waitFor();
 await page.getByLabel('Interview information',{exact:true}).evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event('scroll',{bubbles:true}));});
 await page.getByRole('button',{name:'Start interview',exact:true}).click();
 for (let attempt=0; attempt<30; attempt++) { await page.clock.runFor(100); if (await page.evaluate(()=>window.starts===1)) break; await new Promise(resolve=>setTimeout(resolve,100)); }
 assert.equal(await page.evaluate(()=>window.starts),1);
 assert.equal(await page.locator('.sandbox-list-label').count(),0);
 // Reproduce the Supabase browser-session event that previously conflicted with the dev identity.
 await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');await supabase.auth._notifyAllSubscribers('SIGNED_IN',{user:{id:'different-browser-user'}});});
 const other = await context.newPage();
 await other.goto('about:blank');
 await other.bringToFront();
 await page.bringToFront();
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(500);
 assert.equal(await page.evaluate(()=>window.starts),1);
 assert.equal(profiles,1);
 // Advance browser timers without waiting a full minute.
 await page.clock.fastForward(31000);
 assert.equal(await page.evaluate(()=>window.cues.length),1);
 await page.evaluate(()=>window.voice.onModeChange({mode:'speaking'}));
 await page.evaluate(()=>window.voice.onModeChange({mode:'listening'}));
 await page.clock.fastForward(5000);
 assert.equal(await page.evaluate(()=>window.cues.length),1);
 console.log('Browser passed: focus retains one voice call and profile load, repository label removed, 30-second nudge with no five-second repeat.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
