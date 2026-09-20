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
await test('CASE01','案件列表搜索、关注、显示列与刷新保存',async()=>{
 assert.equal(await page.locator('.case-table tbody tr').count(),2);await shot('list');
 await click('case-tab','[data-tab="favorite"]');assert.equal(await page.locator('.case-table tbody tr').count(),1);
 await click('case-columns');await page.locator('[name=columns][value=amount]').check();await submit();await click('case-save-view');await page.reload();assert(await page.getByRole('columnheader',{name:'损失金额'}).isVisible());
 await click('clear-case-filter');await page.locator('[name=query]').fill('不存在的合成案件');await submit('case-filter');assert.equal(await page.locator('.case-table tbody tr').count(),0);await click('clear-case-filter');assert.equal(await page.locator('.case-table tbody tr').count(),2);
});
await test('CASE02','新增/批量导入校验、转义和清空案件深链',async()=>{
 await click('case-import');await page.locator('[name=rows]').fill('[{"name":"重复","number":"A2026-0912"}]');await submit();assert.match(await page.locator('.form-error').innerText(),/重复/);assert.equal((await snap()).cases.length,2);
 await page.locator('[name=rows]').fill(JSON.stringify([{name:'<img src=x onerror=alert(1)>',number:'DEMO-XSS'}]));await submit();assert.equal((await snap()).cases.length,3);assert.equal(await page.locator('.case-table img').count(),0);
 await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.cases=[];save()});await route('PG13');assert.match(await page.locator('#main').innerText(),/案件/);assert.equal(await page.locator('.case-stepper').count(),0);
});
await test('CASE03','自定义材料不伪造解析、未保存离开保护、TXT导入保护',async()=>{
 await openCase();await page.locator('[name=text]').fill('自定义合成文本，没有结构化解析服务');await step(1);assert(await page.getByRole('dialog').isVisible());await click('close');assert.equal((await flow()).step,0);
 await submit('case-material-form');assert.equal((await flow()).materials[0].status,'已保存原文');assert.equal(await page.locator('.material-entity').count(),0);await step(3);assert(await page.locator('[data-action=case-run]').isDisabled());assert.match(await page.locator('.case-run-banner').innerText(),/示例结构预览/);
 await step(0);await page.locator('#case-material-file').setInputFiles({name:'合成测试.txt',mimeType:'text/plain',buffer:Buffer.from('仅用于测试的合成文本')});await page.waitForTimeout(80);await step(1);assert(await page.getByRole('dialog').isVisible());await click('close');await submit('case-material-form');assert.equal((await flow()).materials[0].text,'仅用于测试的合成文本');
 await click('case-material-demo');assert(await page.getByRole('dialog').isVisible());await submit();await submit('case-material-form');assert.equal((await flow()).materials[0].status,'已解析');
});
await test('CASE04','五步流程、运行暂停恢复、全图/材料图与图标资源',async()=>{
 await prepare();assert.equal(await page.locator('.entity-node').count(),7);await click('case-run');assert.equal(await page.locator('.entity-node').count(),9);assert.equal(await page.locator('.entity-node[data-state=Running]').count(),1);await page.locator('.entity-status-icon').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));const dims=await page.locator('.entity-node[data-state=Running]').evaluate(n=>({width:getComputedStyle(n).width,radius:getComputedStyle(n).borderRadius,icon:getComputedStyle(n.querySelector('.entity-status-icon')).width}));assert.deepEqual(dims,{width:'242px',radius:'16px',icon:'14px'});await shot('running');
 await click('case-advance');await click('case-pause');const paused=await flow();await page.reload();assert.equal((await flow()).run,'Paused');assert.equal((await flow()).tick,paused.tick);await shot('paused');await click('case-resume');await click('case-advance');await click('case-advance');assert.equal((await flow()).run,'Success');await shot('complete');
 await click('case-graph-view','[data-view=full]');assert.equal(await page.locator('.entity-node').count(),26);assert.match(await page.locator('.entity-stage').innerText(),/demo_A/);assert.match(await page.locator('.entity-stage').innerText(),/invest_demo/);await shot('full');
 await click('case-graph-view','[data-view=material]');assert.equal(await page.locator('.entity-node').count(),17);await shot('materials');
 await click('case-graph-view','[data-view=focus]');await page.waitForTimeout(100);const assets=await page.locator('.entity-node img').evaluateAll(images=>images.map(i=>({url:i.src,ok:i.complete&&i.naturalWidth>0})));assert(assets.length>8);assert(assets.every(a=>a.ok),JSON.stringify(assets));
 await click('case-node-detail','[data-id=locp]');assert.match(await page.getByRole('dialog').innerText(),/不是实时定位/);
});
await test('CASE05','节点悬停、选择、菜单、键盘与滚动位置',async()=>{
 await complete();const node=()=>page.locator('[data-node-id=b6071]');await node().hover();assert(await node().locator('.entity-actions').isVisible());await node().click({position:{x:40,y:78}});assert(await node().evaluate(n=>n.classList.contains('is-selected')));await click('node-more','[data-id=b6071]');assert(await page.locator('.entity-menu').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.closest('.entity-menu')!==null),true);await shot('selected-menu');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.entity-menu').count(),0);assert.equal(await page.locator('.is-selected').count(),0);await page.keyboard.press('Enter');assert.equal(await page.locator('.is-selected').count(),1);
 await click('node-more','[data-id=b6071]');await page.locator('.case-section-title').click();assert.equal(await page.locator('.entity-menu').count(),0);
 await click('case-graph-view','[data-view=full]');await page.locator('.entity-viewport').evaluate(el=>el.scrollTop=170);const scroll=await page.locator('.entity-viewport').evaluate(el=>el.scrollTop);await page.locator('[data-node-id=phone]').click({position:{x:50,y:65}});assert.equal(await page.locator('.entity-viewport').evaluate(el=>el.scrollTop),scroll);
 const before=Number(await page.locator('[data-graph=case]').getAttribute('data-scale'));await click('node-zoom','[data-delta=".15"]');assert(Number(await page.locator('[data-graph=case]').getAttribute('data-scale'))>before);await click('node-fit');assert.equal(await page.locator('[data-graph=case]').getAttribute('data-zoom'),'fit');
});
await test('CASE06','失败、部分成功、空结果与演示授权均需显式恢复',async()=>{
 await prepare();const baseline=await snap();
 for(const [scenario,expected] of [['failure','Error'],['partial','Exception'],['permission','Waiting'],['empty','Exception']]){
  await set({...structuredClone(baseline),scenario});await click('case-run');await click('case-advance');if(scenario!=='empty')await click('case-advance');assert.equal((await flow()).run,expected);await page.locator('.entity-status-icon').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));assert(await page.locator('[data-action=case-generate-report]').isDisabled());
  const tick=(await flow()).tick;await page.reload();assert.equal((await flow()).tick,tick);assert.equal((await flow()).run,expected);
  if(scenario==='empty')await set({scenario:'success'});await click('case-resume');while((await flow()).run==='Running')await click('case-advance');assert.equal((await flow()).run,'Success');
 }
});
await test('CASE07','案件隔离、材料变更失效、冻结报告不随改动变化',async()=>{
 await complete();await click('case-generate-report');const s=await snap(),r=s.reports[0];assert.equal(r.graphSnapshot.nodes.length,26);assert.equal(r.caseSources.length,3);assert.equal(await page.locator('.is-readonly [data-action]').count(),0);await shot('report');
 await route('PG12');await click('open-case','[data-id=CASE-0802]');assert.equal((await flow()).run,'Idle');assert.equal((await flow()).materials[0].status,'待解析');
 await route('PG12');await openCase();await step(0);await page.locator('[name=text]').fill('新材料（合成）');await submit('case-material-form');assert.equal((await flow()).run,'Idle');assert.equal((await flow()).reportId,null);const updated=await snap();assert.equal(updated.cases.find(c=>c.id===s.selectedCase).status,'待研判');assert.deepEqual(updated.reports[0].graphSnapshot,r.graphSnapshot);assert.deepEqual(updated.reports[0].caseSources,r.caseSources);
});
await test('CASE08','报告编辑、来源、版本复核及JSON冻结快照导出',async()=>{
 await complete();await click('case-generate-report');await click('case-report-edit');await click('evidence');assert.match(await page.getByRole('dialog').innerText(),/冻结材料快照/);await click('close');
 await page.locator('#report-form [name=content]').fill((await page.locator('#report-form [name=content]').inputValue())+'\n人工补充：需检查反证。');await submit('report-form');assert.equal((await snap()).reports[0].version,2);for(let i=1;i<=3;i++)await page.locator(`[name=report-check-${i}]`).check();await click('submit-review');await route('PG25');await click('review-pass');assert.match(await page.locator('#toast').innerText(),/不允许自审|业务负责人/);
 await set({role:'业务负责人',user:'演示复核员'});await click('review-pass');await page.locator('[name=reason]').fill('合成材料与历史位置限制已核对');await submit();assert.equal((await snap()).reports[0].status,'已复核');await page.locator('[name=purpose]').fill('合成原型验收');for(const c of await page.locator('#export-report-form [type=checkbox]').all())await c.check();await page.locator('[name=format]').selectOption('JSON（含来源元信息）');const download=page.waitForEvent('download');await submit('export-report-form');const file=await download;const data=JSON.parse(await fs.readFile(await file.path(),'utf8'));assert.equal(data.graphSnapshot.nodes.length,26);assert.equal(data.caseSources.length,3);await shot('review');
});
await test('CASE09','无权限/管理员/组织切换时不泄露案件正文',async()=>{
 await complete();for(const fields of [{role:'平台管理员'},{role:'研判人员',permission:false},{role:'研判人员',permission:true,org:'其他组织'}]){await set(fields);for(const id of ['PG12','PG13']){await route(id);assert.equal(await page.locator('.case-stepper,.case-table,.entity-node').count(),0);assert(!(await page.locator('#main').innerText()).includes('128,000'))}}
});
await test('CASE10','明暗主题、三种宽度无全局溢出与减少动态效果',async()=>{
 await complete();for(const theme of ['light','dark']){await set({theme});for(const width of [1440,1024,390]){await page.setViewportSize({width,height:1080});for(const id of ['PG12','PG13']){await route(id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${theme} ${width} ${id} overflow`);if(id==='PG13'&&width===390)assert(await page.locator('.case-stepper [aria-current=step]').evaluate(n=>{const a=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right}));await shot(`${id}-${theme}-${width}`)}}}
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.caseFlows[state.selectedCase].run='Running';save()});await page.reload();
 const animation=await page.locator('.entity-node[data-state=Running] .entity-status-icon').evaluate(n=>getComputedStyle(n).animationName);assert.equal(animation,'none');
});
await fs.writeFile(path.join(out,'case-workflow-results.json'),JSON.stringify({testedAt:new Date().toISOString(),summary:{passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length},errors,results},null,2));await browser.close();if(errors.length||results.some(r=>r.status==='FAIL'))process.exitCode=1;
