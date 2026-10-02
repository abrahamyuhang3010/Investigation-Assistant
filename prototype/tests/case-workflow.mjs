import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const out=path.join(root,'audit/frontend-sync-2026-09-20');await fs.mkdir(out,{recursive:true});
const results=[],errors=[];let page,context;
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const snap=()=>page.evaluate(async()=>structuredClone((await import('/src/state.js')).state));
const flow=async()=>{const s=await snap();return s.caseFlows[s.selectedCase]};
const click=async(action,extra='')=>{await page.locator(`[data-action="${action}"]${extra}`).first().click();await page.waitForTimeout(30)};
const submit=async(id='modal-form')=>{await page.locator(`#${id} [type=submit]`).click();await page.waitForTimeout(30)};
const step=async n=>{await page.locator(`.case-stepper [data-step="${n}"]`).click();await page.waitForTimeout(30)};
const route=async id=>{await page.evaluate(id=>location.hash='/'+id,id);await page.waitForTimeout(80)};
const set=async fields=>{await page.evaluate(async fields=>{const {state,save}=await import('/src/state.js');Object.assign(state,fields);save()},fields);await page.reload()};
const openCase=async()=>click('open-case','[data-id="CASE-0817"]');
const prepare=async()=>{await openCase();for(let i=0;i<3;i++){await submit('case-material-form');await step(i+1)}};
const complete=async()=>{await prepare();await click('case-run');for(let i=0;i<3;i++)await click('case-advance');assert.equal((await flow()).run,'Success')};
const shot=async name=>{await page.locator('#toast').evaluate(el=>el.classList.remove('show'));await page.screenshot({path:path.join(out,name+'.png'),fullPage:false})};
async function test(id,name,fn){context=await browser.newContext({viewport:{width:1440,height:1080},acceptDownloads:true});page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push({id,message:e.message}));await page.goto(base+'/#/PG12');try{await fn();results.push({id,name,status:'PASS'})}catch(e){results.push({id,name,status:'FAIL',error:e.message});await shot(id+'-failure')}finally{console.log(results.at(-1));await context.close()}}
await test('CASE01','案件列表搜索、筛选、冻结列、显示列与刷新保存',async()=>{
 assert.equal(await page.locator('.case-table tbody tr').count(),2);
 assert.equal(await page.locator('.case-list-caption').count(),1);
 assert.equal((await page.locator('.case-list-footer').innerText()).trim(),'共 2 条');
 assert(!/合成记录|当前全部展示|中间字段可横向滚动/.test(await page.locator('.case-list-panel').innerText()));
 assert.deepEqual((await page.locator('.case-table thead th').allTextContents()).map(x=>x.trim()),['','序号','案件名称/编号','研判状态','笔录数','现勘数','研判结果','立案单位','受理时间','立案时间','简要案情','案件类型','案件状态','更新时间','受理单位','操作']);
 await shot('list');
 await click('case-tab','[data-tab="favorite"]');assert.equal(await page.locator('.case-table tbody tr').count(),1);await click('clear-case-filter');
 await click('case-filters');assert.equal(await page.locator('#case-advanced-filter').count(),1);assert.deepEqual(await page.locator('#case-advanced-filter .case-filter-item>span:first-child').allTextContents(),['案件类型','研判状态','案件状态','立案单位','受理时间','立案时间','更新时间']);
 await page.locator('[name=category]').selectOption('资金线索');assert.equal(await page.locator('.case-table tbody tr').count(),1);await click('case-filters');assert.equal(await page.locator('#case-advanced-filter').count(),0);
 await click('case-columns');assert.equal(await page.locator('.case-column-option').count(),18);for(const key of ['name','acceptedAt','filedAt']){const input=page.locator(`[data-case-column="${key}"]`);assert(await input.isChecked());assert(await input.isDisabled());}
 await page.locator('[data-case-column=amount]').check();await click('case-save-view');await page.reload();assert(await page.getByRole('columnheader',{name:'涉案金额'}).isVisible());
 await click('clear-case-filter');await page.locator('[name=query]').fill('不存在的合成案件');await page.locator('[name=query]').press('Enter');await page.waitForTimeout(30);assert.equal(await page.locator('.case-table tbody tr').count(),0);await click('clear-case-filter');assert.equal(await page.locator('.case-table tbody tr').count(),2);
});
await test('CASE02','新增/批量导入校验、转义和清空案件深链',async()=>{
 await click('case-import');await page.locator('[name=rows]').fill('[{"name":"重复","number":"A2026-0912"}]');await submit();assert.match(await page.locator('.form-error').innerText(),/重复/);assert.equal((await snap()).cases.length,2);
 await page.locator('[name=rows]').fill(JSON.stringify([{name:'<img src=x onerror=alert(1)>',number:'DEMO-XSS'}]));await submit();assert.equal((await snap()).cases.length,3);assert.equal(await page.locator('.case-table img').count(),0);
 await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.cases=[];save()});await route('PG13');assert.match(await page.locator('#main').innerText(),/案件/);assert.equal(await page.locator('.case-stepper').count(),0);
});
await browser.close();assert.deepEqual(errors,[]);assert(results.every(r=>r.status==='PASS'));
// Approved 924:2 replaces the old material-form detail UI; preserve its coverage in the new suite.
await import('./case-detail.mjs');
