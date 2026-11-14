const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 try {
 const context=await browser.newContext({permissions:['microphone','camera']});
 const page=await context.newPage();
 await page.addInitScript(()=>{window.mediaRequests=0;const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.mediaRequests++;return original(...args)};});
 await page.route('**/__dev/profile',r=>r.fulfill({json:{user:{id:'local-test'},profile:{id:'local-test',assessment_completed:true}}}));
 await page.route('**/node_modules/.vite/deps/@elevenlabs_client.js*',r=>r.fulfill({contentType:'application/javascript',body:`export const Conversation={startSession:async options=>{window.voiceStarts=(window.voiceStarts||0)+1;return {sendContextualUpdate(){},sendUserMessage(){},endSession:async()=>{}}}};`}));
 await page.route('**/voice/*session*',r=>r.fulfill({json:{signed_url:'wss://example.test',variables:{}}}));
 await page.route('**/api/repo-challenges/example?*',r=>r.fulfill({json:{id:'example',title:'Example',difficulty:'Easy',language:'python',estimatedMinutes:20,description:'Fix it.',objective:'Fix it.',expectedBehavior:'Correct result.',constraints:[],entrypoint:'main.py',files:[{path:'main.py',content:'print(1)',language:'python',readOnly:false}]}}));
 const base=process.env.CLARIO_TEST_URL||'http://127.0.0.1:5179';
 for(const path of ['/interview/two-sum','/interview/repo/example','/repo-debugging/example','/interview/system-design/bumble-matching']) {
   await page.goto(base+path);
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   assert.equal(await page.getByRole('button',{name:'Start interview',exact:true}).isDisabled(),true);
   assert.equal(await page.evaluate(()=>window.mediaRequests),0);
   assert.match(await dialog.innerText(),/does not save camera video/);
 }
 await page.goto(base+'/interview/repo/example');
 const scroll=page.getByLabel('Interview information',{exact:true});await scroll.waitFor();
 await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event('scroll',{bubbles:true}));});
 const start=page.getByRole('button',{name:'Start interview',exact:true});await start.click();
 await page.waitForFunction(()=>window.voiceStarts===1);
 assert.equal(await page.getByRole('dialog').count(),0);
 assert.ok(await page.evaluate(()=>window.mediaRequests)>0);
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/interview/repo/example');await page.getByRole('dialog').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 console.log('Passed: four interview routes gated; scroll required; no media before consent; one voice start after consent; mobile fits.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
