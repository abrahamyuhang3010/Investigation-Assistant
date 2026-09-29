import assert from 'node:assert/strict';
import path from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const results=[],errors=[];let page,context;
const snap=()=>page.evaluate(async()=>structuredClone((await import('/src/state.js')).state));
const superSnap=()=>page.evaluate(async()=>structuredClone((await import('/src/super-search-model.js')).ensureSuperSearchState()));
const click=async(action,extra='')=>{const selector=`[data-action="${action}"]${extra}`;const overlay=page.locator('#overlay '+selector).filter({visible:true});await (await overlay.count()?overlay:page.locator(selector).filter({visible:true})).first().click()};
const route=async id=>{await page.evaluate(id=>location.hash='/'+id,id);await page.waitForTimeout(100)};
async function role(name){await click('profile');await page.locator('#overlay [name=role]').selectOption(name);await page.locator('#overlay button[type=submit]').click();await page.waitForTimeout(100)}
async function reset(){await page.evaluate(async()=>{(await import('/src/state.js')).reset()});await page.reload();await page.locator('.super-search-page').waitFor()}
async function selectQuery(id){await page.evaluate(async id=>{const m=await import('/src/super-search-model.js');m.selectSuperQuery(id);(await import('/src/state.js')).save()},id);await page.reload();await page.locator('.super-search-page').waitFor()}
async function test(name,fn){context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});page=await context.newPage();page.on('pageerror',e=>errors.push({name,error:e.message}));try{await page.goto(base+'/#/PG05');await reset();await fn();results.push({name,status:'PASS'})}catch(error){results.push({name,status:'FAIL',error:error.stack})}console.log(results.at(-1));await context.close()}
await test('FL08 权限申请、审批、激活、显式恢复跨页闭环',async()=>{
 await selectQuery('QUERY-04');const permissionId=(await superSnap()).permissions[0].id;
 await click('super-permission-apply',`[data-id="${permissionId}"]`);
 assert.equal(await page.evaluate(()=>location.hash),'#/PG26');let ss=await superSnap();assert.equal(ss.query.status,'waiting_approval');assert.equal(ss.permissions.find(p=>p.id===permissionId).status,'requested');const app=(await snap()).applications[0];assert.equal(app.status,'待审批');
 await role('审批人员');await route('PG27');await click('application-review',`[data-id="${app.id}"]`);await page.locator('#overlay [name=reason]').fill('同意最小范围、24小时演示授权');await page.locator('#overlay button[type=submit]').click();assert.equal((await snap()).applications.find(a=>a.id===app.id).status,'已批准');ss=await superSnap();assert.equal(ss.permissions.find(p=>p.id===permissionId).status,'approved');assert.equal(ss.query.status,'waiting_approval');
 await role('研判人员');await route('PG26');await click('application-act',`[data-id="${app.id}"]`);assert.equal(await page.evaluate(()=>location.hash),'#/PG05');ss=await superSnap();assert.equal(ss.permissions.find(p=>p.id===permissionId).status,'active');assert.equal(ss.query.resumeAvailable,true);assert.equal(ss.query.status,'waiting_approval');assert(await page.locator('[data-action=super-resume-query]').isVisible());
 await click('super-resume-query');ss=await superSnap();assert.equal(ss.query.status,'running');assert.equal(ss.query.resumeAvailable,false);assert(ss.agents.flatMap(a=>a.toolCalls).some(t=>t.status==='running'));
});
await test('FL05 PG05 Artifact 到 PG09 保留投影来源、筛选和导出契约',async()=>{
 await selectQuery('QUERY-01');await click('super-workspace-tab','[data-tab="文档空间"]');const artifact=page.locator('[data-artifact-id="ART-METRIC"]');assert(await artifact.isVisible());await artifact.locator('[data-action=super-open-fund-analysis]').click();assert.equal(await page.evaluate(()=>location.hash),'#/PG09');await page.locator('#fund-filter').waitFor();let text=await page.locator('#main').innerText();assert.match(text,/Query QUERY-01/);assert.match(text,/Artifact ART-METRIC/);
 await page.locator('[name=status]').selectOption('有效');await page.locator('#fund-filter [type=submit]').click();text=await page.locator('#main').innerText();assert.match(text,/Query QUERY-01/);assert.match(text,/Artifact ART-METRIC/);assert.equal(await page.locator('tbody tr').filter({hasText:'冲正'}).count(),0);
 const downloadPromise=page.waitForEvent('download');await click('export-transactions');const download=await downloadPromise;const body=await (await import('node:fs/promises')).readFile(await download.path(),'utf8');assert.match(body,/queryId/);assert.match(body,/artifactId/);assert.match(body,/QUERY-01/);assert.match(body,/ART-METRIC/);
 await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');delete state.superSearchFundContext;save()});await page.reload();text=await page.locator('#main').innerText();assert.match(text,/合成交易共4条/);assert(await page.locator('#fund-filter').isVisible());
});
console.log(`${results.filter(r=>r.status==='PASS').length}/${results.length}; runtime errors: ${errors.length}`);await browser.close();if(results.some(r=>r.status==='FAIL')||errors.length)process.exitCode=1;
