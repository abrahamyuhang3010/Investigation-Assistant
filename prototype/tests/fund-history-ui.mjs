import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1680,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186',out=path.resolve('audit/fund-history-v2');await fs.mkdir(out,{recursive:true});
const snap=()=>page.evaluate(async()=>(await import('/src/super-search-model.js')).ensureSuperSearchState());
const click=async(action,id)=>{const selector=`[data-action="${action}"]${id?`[data-id="${id}"]`:''}`;const modal=page.locator('#overlay '+selector).filter({visible:true});await (await modal.count()?modal.first():page.locator(selector).filter({visible:true}).first()).click();};
const tab=name=>page.locator(`[data-action="super-workspace-tab"][data-tab="${name}"]`).filter({visible:true}).first().click();
try{
 await page.goto(base+'/#/PG05');await page.evaluate(async()=>{(await import('/src/state.js')).reset()});await page.reload();await page.locator('.super-search-page').waitFor();
 await click('super-session-open','SS-20260918-0217');
 const first=await snap();assert.equal(first.query.status,'done');assert.equal(first.queries.length,1);assert.equal(await page.locator('.ss-task-detail-card').count(),1);assert.equal(await page.locator('.ss-subtask').count(),5);assert.equal(await page.locator('.ss-query-attachment').count(),3);assert.deepEqual(await page.locator('.ss-query-stack').first().locator(':scope > *').evaluateAll(nodes=>nodes.map(node=>node.className)),['ss-query-attachment','ss-query-attachment','ss-query-attachment','ss-query-text']);assert.equal(await page.locator('.ss-tool').count(),33);assert.equal(await page.locator('.ss-permission-batch').count(),0);
 assert(!/林泽宇|刘倩|梁嘉豪|蒋文浩|马思远|何俊峰/.test(await page.locator('.ss-task-subtasks').innerText()));
 assert.equal(await page.evaluate(async()=>{const m=await import('/src/super-search-model.js');return m.tickSuperSearch(Date.now()+30000)}),false);
 assert.deepEqual((await snap()).query.events,first.query.events);
 await page.screenshot({path:path.join(out,'history-1680.png'),fullPage:true});
 await click('super-task-source','FUND-ST-02');assert.equal((await snap()).activeTab,'工作空间');assert.equal((await snap()).ui.highlightTool,'CTX-001');
 await click('super-tool-toggle','RPA-BANK-001');const bank=page.locator('[data-tool-id="RPA-BANK-001"]');assert.equal(await bank.locator('[role="tab"]').count(),3);assert.match(await bank.innerText(),/6222 02\*\* \*\*\*\* 3813/);
 await bank.locator('[data-tab="输出结果"]').click();assert.match(await bank.innerText(),/8,214/);await bank.locator('[data-tab="技术详情"]').click();assert.match(await bank.innerText(),/req_fund_20260918_140831_4812/);
 await click('super-tool-toggle','ANALYSIS-001');const analysis=page.locator('[data-tool-id="ANALYSIS-001"]');assert.equal(await analysis.locator('[role="tab"]').count(),4);await analysis.locator('[data-tab="运行代码"]').click();assert.match(await analysis.locator('.ss-code-panel').innerText(),/93.75/);
 await click('super-file-preview','FUND-REPORT');assert.equal((await snap()).activeTab,'文档空间');assert((await snap()).ui.expandedFolders.includes('TASK-20260918-0217'));assert.match(await page.locator('.ss-preview').innerText(),/93.75%/);assert(!/张三|286,400/.test(await page.locator('.ss-preview').innerText()));
 const pdfDownload=page.waitForEvent('download');await click('super-file-download','FUND-REPORT');const pdf=await pdfDownload;await pdf.saveAs(path.join(out,'download-report.pdf'));assert.equal((await fs.readFile(path.join(out,'download-report.pdf'))).subarray(0,5).toString(),'%PDF-');await click('close');
 await click('super-file-preview','FUND-UPLOAD-1');assert.equal((await snap()).ui.highlightArtifact,'FUND-UPLOAD-1');assert.match(await page.locator('.ss-preview').innerText(),/陈浩/);assert(!/张三/.test(await page.locator('.ss-preview').innerText()));await click('close');
 await tab('文档空间');assert.equal(await page.getByText('任务产物',{exact:true}).count(),0);assert.equal(await page.locator('.ss-file-folder').count(),2);const taskFolder=page.locator('[data-action="super-folder-toggle"][data-id="TASK-20260918-0217"]');assert(await taskFolder.isVisible());assert.match(await taskFolder.innerText(),/围绕陈浩被骗的8万元资金/);if(await taskFolder.getAttribute('aria-expanded')==='false')await taskFolder.click();assert.equal(await page.locator('.ss-file-folder-child').count(),0);await click('super-file-preview','FUND-FLOW-zhou');assert.match(await page.locator('.ss-table-preview').innerText(),/50000/);assert.match(await page.locator('.ss-preview-source').innerText(),/8,214/);const xlsxDownload=page.waitForEvent('download');await click('super-file-download','FUND-FLOW-zhou');await (await xlsxDownload).saveAs(path.join(out,'download-flow.xlsx'));await click('close');
 await tab('导图空间');assert.equal(await page.locator('.ss-edge-hit').count(),22);assert.equal(await page.locator('.ss-graph-canvas .entity-node').count(),21);await page.screenshot({path:path.join(out,'graph.png'),fullPage:true});
 await page.locator('.ss-relation-list [data-id="FUND-R-T-0918-003"]').click();assert.match(await page.locator('.ss-entity-detail').innerText(),/¥30,000/);assert.match(await page.locator('.ss-entity-detail').innerText(),/ICBC2026091813482100381728/);assert.equal(await page.locator('.ss-entity-detail [data-action="super-file-preview"]').count(),2);
 await click('super-graph-context','FUND-R-T-0918-003');assert.equal((await snap()).ui.contextChips.length,1);assert.equal((await snap()).queries.length,1);assert.match(await page.locator('.ss-composer-chips').innerText(),/30,000/);
 await page.locator('.ss-entity-detail [data-action="super-file-preview"][data-id="FUND-FLOW-lin"]').click();assert.equal((await snap()).activeTab,'文档空间');assert.equal((await snap()).ui.highlightArtifact,'FUND-FLOW-lin');await click('close');
 await tab('导图空间');await page.locator('[data-action="node-select"][data-id="FUND-P-周凯"]').click();await click('super-graph-context','FUND-P-周凯');assert((await snap()).ui.contextChips.some(c=>c.label==='周凯'));
 await click('super-graph-evidence','FUND-P-周凯');assert.match(await page.getByRole('dialog').innerText(),/周凯_工商银行/);await click('close');
 // Click a real SVG edge at its midpoint (not only its keyboard list alternative).
 await page.locator('[data-action="node-fit"]').filter({visible:true}).click();
 const point=await page.locator('.ss-edge-hit[data-id="FUND-R-T-0918-003"]').evaluate(el=>{const p=el.getPointAtLength(el.getTotalLength()*.5),q=new DOMPoint(p.x,p.y).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}});
 await page.mouse.click(point.x,point.y);assert.equal((await snap()).graph.selectedRelation,'FUND-R-T-0918-003');
 const other=await page.locator('[data-action="super-session-open"]:not([data-id="SS-20260918-0217"])').first().getAttribute('data-id');
 await click('super-session-open',other);await click('super-session-open','SS-20260918-0217');assert.equal((await snap()).graph.selectedRelation,'FUND-R-T-0918-003');
 await page.reload();assert.equal((await snap()).activeTab,'导图空间');assert.equal((await snap()).query.status,'done');assert.equal((await snap()).queries.length,1);
 await tab('工作空间');await page.locator('.ss-suggested-query').first().click();assert.match(await page.locator('#super-search-prompt').inputValue(),/蒋文浩/);assert.equal((await snap()).queries.length,1);
 for(const width of [1440,1680,1920,2048]){
  await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
  const metrics=await page.evaluate(()=>{const card=document.querySelector('.ss-task-detail-card'),center=document.querySelector('.ss-center'),input=document.querySelector('.ss-composer-dock');return {card:card.getBoundingClientRect().right,center:center.getBoundingClientRect().right,input:input.getBoundingClientRect().bottom}});assert(metrics.card<=metrics.center+1);assert(metrics.input<=1001);
  await page.screenshot({path:path.join(out,`layout-${width}.png`),fullPage:true});
 }
 await page.locator('[data-action="super-pane-collapse"][data-pane="right"]').filter({visible:true}).first().click();assert(await page.locator('.super-search-page.ss-right-collapsed').count());await page.locator('[data-action="super-pane-expand"][data-pane="right"]').filter({visible:true}).first().click();assert.equal(await page.locator('.super-search-page.ss-right-collapsed').count(),0);
 await page.locator('.super-search-page').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
 const handle=page.locator('.ss-workspace-resizer'),box=await handle.boundingBox(),beforeWidth=await page.locator('.ss-workspace-rail').evaluate(el=>el.clientWidth);
 await page.mouse.move(box.x+4,box.y+60);await page.mouse.down();await page.mouse.move(box.x-96,box.y+60,{steps:8});await page.mouse.up();
 assert((await snap()).ui.workspaceWidth>beforeWidth+80,'drag resizes workspace');await handle.focus();await page.keyboard.press('ArrowRight');
 const savedWidth=(await snap()).ui.workspaceWidth;await page.reload();assert.equal((await snap()).ui.workspaceWidth,savedWidth);
 await tab('工作空间');
 await page.locator('.ss-messages').evaluate(el=>{el.scrollTop=120});const scrollBefore=await page.locator('.ss-messages').evaluate(el=>el.scrollTop);
 await page.locator('.ss-right-content').evaluate(el=>{el.scrollTop=600});assert.equal(await page.locator('.ss-messages').evaluate(el=>el.scrollTop),scrollBefore);assert(await page.locator('.ss-right-content').evaluate(el=>el.scrollTop>0));
 await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.theme='dark';save()});await page.reload();await page.screenshot({path:path.join(out,'dark.png'),fullPage:true});
 // Sending a contextual follow-up must never inject the unrelated default fixture.
 const historical=JSON.stringify((await snap()).queries[0]);
 await page.locator('#super-search-prompt').fill('继续追踪蒋文浩的资金去向');await page.locator('#super-search-composer [type="submit"]').click();
 const follow=await snap();assert.equal(follow.queries.length,2);assert.equal(JSON.stringify(follow.queries[0]),historical);assert.equal(follow.query.contextChips.length,2);assert(follow.query.historicalFollowup);assert.match(follow.query.finalConclusion,/没有新增流水/);assert(!/张三|286400/.test(JSON.stringify(follow)));assert.equal(follow.artifacts.length,27);
 assert.deepEqual(errors,[]);console.log('PASS: history, single card, 33 Actions, file provenance/downloads, graph/context, persistence, 4 desktop widths, collapse, dark theme');
 await fs.writeFile(path.join(out,'ui-results.json'),JSON.stringify({status:'PASS',errors,widths:[1440,1680,1920,2048]},null,2));
}finally{await browser.close()}
