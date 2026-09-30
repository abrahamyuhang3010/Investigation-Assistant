import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

let playwright;
try{playwright=await import('playwright')}catch{playwright=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await playwright.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1680,height:1000},acceptDownloads:true});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const out=path.resolve('audit/network-history-v1');
await fs.mkdir(out,{recursive:true});
const snap=()=>page.evaluate(async()=>(await import('/src/super-search-model.js')).ensureSuperSearchState());
const click=async(action,id)=>{
  const selector=`[data-action="${action}"]${id?`[data-id="${id}"]`:''}`;
  const modal=page.locator('#overlay '+selector).filter({visible:true});
  await (await modal.count()?modal.first():page.locator(selector).filter({visible:true}).first()).click();
};
const tab=name=>page.locator(`[data-action="super-workspace-tab"][data-tab="${name}"]`).filter({visible:true}).first().click();

try{
  await page.goto(base+'/#/PG05');
  await page.evaluate(async()=>{(await import('/src/state.js')).reset()});
  await page.reload();
  await page.locator('.super-search-page').waitFor();
  const sessionsBeforeOpen=await page.evaluate(async()=>structuredClone((await import('/src/state.js')).state.sessions));
  assert(!sessionsBeforeOpen.some(session=>session.id==='SS-NET-20260926-0148'),'Sidebar render must keep the network fixture virtual');
  const historyRow=page.locator('[data-action="super-session-open"][data-id="SS-NET-20260926-0148"]');
  assert(await historyRow.isVisible());
  assert.match(await historyRow.innerText(),/涉案域名嫌疑终端及窝点研判/);
  assert.equal((await historyRow.innerText()).trim(),'涉案域名嫌疑终端及窝点研判');
  await historyRow.click();
  const sessionsAfterOpen=await page.evaluate(async()=>structuredClone((await import('/src/state.js')).state.sessions));
  assert.equal(sessionsAfterOpen.length,sessionsBeforeOpen.length+1);
  assert(sessionsAfterOpen.some(session=>session.id==='SS-NET-20260926-0148'),'Opening the row materializes exactly one historical session');

  const first=await snap();
  assert.equal(first.fixture,'network-v1');
  assert.equal(first.query.id,'TASK-NET-20260926-001');
  assert.equal(first.query.status,'done');
  assert.equal(first.query.planVersion,1);
  assert.equal(first.query.replanCount,0);
  assert.equal(first.queries.length,1);
  assert.equal(await page.locator('.ss-task-detail-card').count(),1);
  assert.equal(await page.locator('.ss-subtask').count(),6);
  assert.equal(await page.locator('.ss-query-attachment').count(),3);
  assert.deepEqual(await page.locator('.ss-query-stack').first().locator(':scope > *').evaluateAll(nodes=>nodes.map(node=>node.className)),['ss-query-attachment','ss-query-attachment','ss-query-attachment','ss-query-text']);
  assert.deepEqual(await page.locator('.ss-query-attachment .ss-file-type').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src'))),['/assets/super-search/file-icons/pdf.svg','/assets/super-search/file-icons/image.svg','/assets/super-search/file-icons/apk.svg']);
  assert.equal(await page.locator('.ss-query-stack').first().evaluate(stack=>{const rights=[...stack.children].map(node=>Math.round(node.getBoundingClientRect().right));return new Set(rights).size;}),1);
  assert.equal(await page.locator('.ss-tool').count(),19);
  assert.equal(await page.locator('.ss-permission-batch').count(),0);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/6 \/ 6 子任务已完成/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/查看网络关系图/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/重点嫌疑终端/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/疑似窝点/);
  assert.equal(await page.locator('.ss-task-detail-card').getByText('网信阶段结果卡').count(),0);
  assert.equal(await page.locator('.ss-task-detail-card').getByText('域名溯源卡').count(),0);
  const planText=await page.locator('.ss-task-subtasks').innerText();
  for(const leaked of ['7e2a8f5c0d8b43f3aa17c910d44b6e52','a4f3d6987ec241c1b683c9ad7d91f5e0','198.51.100.42','02:6A:9B:41:7C:10','02:10:7A:44:31:A0','Myawadi','园区A'])assert(!planText.includes(leaked),leaked);
  assert.equal(await page.evaluate(async()=>{const model=await import('/src/super-search-model.js');return model.tickSuperSearch(Date.now()+60000)}),false);
  assert.deepEqual((await snap()).query.events,first.query.events);
  await page.screenshot({path:path.join(out,'history-1680.png'),fullPage:true});

  await click('super-task-source','NET-ST-03');
  assert.equal((await snap()).activeTab,'工作空间');
  assert(['TERMINAL-PROFILE-001','TERMINAL-RISK-001'].includes((await snap()).ui.highlightTool));
  assert.equal(await page.locator('.ss-agent-card').count(),2);
  assert.match(await page.locator('.ss-agent-card').nth(0).innerText(),/信息获取 Agent/);
  assert.match(await page.locator('.ss-agent-card').nth(0).innerText(),/网信调证 · 终端查询 · 网络基础设施获取/);
  assert.match(await page.locator('.ss-agent-card').nth(1).innerText(),/数据分析 Agent/);
  assert.match(await page.locator('.ss-agent-card').nth(1).innerText(),/文档解析 · 终端筛选 · 地址聚合 · 窝点分析/);

  await click('super-tool-toggle','NET-DOMAIN-001');
  const domain=page.locator('[data-tool-id="NET-DOMAIN-001"]');
  assert.equal(await domain.locator('[role="tab"]').count(),3);
  assert.match(await domain.innerText(),/域名关联终端溯源/);
  assert.match(await domain.innerText(),/17.4s/);
  assert(!/DMX_15/.test(await domain.locator('.ss-tool-row').innerText()));
  await domain.locator('[data-tab="执行信息"]').click();
  assert.match(await domain.innerText(),/研判终端、虚拟账户等（锋刃）/);
  await domain.locator('[data-tab="输出结果"]').click();
  assert.match(await domain.innerText(),/发现关联终端3个/);
  await domain.locator('[data-tab="技术详情"]').click();
  assert.match(await domain.innerText(),/DMX_15/);
  assert.match(await domain.innerText(),/req_net_domain_20260926_102011_1842/);
  assert.match(await domain.innerText(),/retry_count/);

  await click('super-tool-toggle','ANALYSIS-NEST-001');
  const nestAction=page.locator('[data-tool-id="ANALYSIS-NEST-001"]');
  assert.equal(await nestAction.locator('[role="tab"]').count(),4);
  await nestAction.locator('[data-tab="运行代码"]').click();
  assert.match(await nestAction.locator('.ss-code-panel').innerText(),/require_verification=True/);

  await click('super-file-preview','NET-REPORT');
  assert.equal((await snap()).activeTab,'文档空间');
  assert((await snap()).ui.expandedFolders.includes('TASK-NET-20260926-001'));
  assert.match(await page.getByRole('dialog').innerText(),/涉案域名嫌疑终端及窝点研判报告/);
  assert.match(await page.getByRole('dialog').innerText(),/Myawadi, Kayin State, Myanmar/);
  assert.match(await page.getByRole('dialog').innerText(),/建议结合其他侦查数据进一步核验/);
  const reportDownload=page.waitForEvent('download');
  await click('super-file-download','NET-REPORT');
  const downloaded=await reportDownload;
  const reportPath=path.join(out,'network-report.pdf');
  await downloaded.saveAs(reportPath);
  assert.equal((await fs.readFile(reportPath)).subarray(0,5).toString(),'%PDF-');
  await click('close');

  await tab('文档空间');
  assert.equal(await page.getByText('任务产物',{exact:true}).count(),0);
  assert.equal(await page.locator('.ss-file-folder').count(),2);
  assert(await page.locator('[data-action="super-folder-toggle"][data-id="UPLOAD"]').isVisible());
  const taskFolder=page.locator('[data-action="super-folder-toggle"][data-id="TASK-NET-20260926-001"]');
  assert(await taskFolder.isVisible());
  assert.match(await taskFolder.innerText(),/围绕涉案域名 secure-refund-center\.example\.com/);
  if(await taskFolder.getAttribute('aria-expanded')==='false')await taskFolder.click();
  assert.equal(await page.locator('.ss-file-folder-child').count(),0);
  assert.equal(await page.locator('.ss-file-folder').nth(1).locator('.ss-artifact-row').count(),38);
  await click('super-file-preview','NET-TERMINAL-01-6');
  assert.match(await page.getByRole('dialog').innerText(),/198.51.100.42/);
  assert.match(await page.getByRole('dialog').innerText(),/TERMINAL-PROFILE-001/);
  await click('close');
  await click('super-file-preview','NET-UPLOAD-SCREENSHOT');
  assert.match(await page.getByRole('dialog').innerText(),/模拟截图：退款验证页面展示/);
  await click('close');
  await click('super-file-preview','NET-UPLOAD-APK');
  assert.match(await page.getByRole('dialog').innerText(),/不包含可执行二进制/);
  await click('close');

  await tab('导图空间');
  assert.equal(await page.locator('.ss-graph-canvas .entity-node').count(),22);
  assert.equal(await page.locator('.ss-edge-hit').count(),27);
  assert.equal(await page.locator('.ss-relation-list [data-action="super-relation-detail"]').count(),27);
  await page.locator('.ss-relation-list [data-action="super-relation-detail"][data-id="NET-R-T1-H1"]').click();
  let detail=page.locator('.ss-entity-detail');
  assert.match(await detail.innerText(),/Terminal-01 → 198.51.100.42/);
  assert.match(await detail.innerText(),/历史IP关联/);
  assert.match(await detail.innerText(),/2026-09-25 21:58/);
  assert.match(await detail.innerText(),/Terminal-01 \/ 历史IP清单.xlsx/);
  const beforeContext=await snap();
  await detail.locator('[data-action="super-graph-context"]').click();
  const afterContext=await snap();
  assert.equal(afterContext.queries.length,beforeContext.queries.length);
  assert(afterContext.ui.contextChips.some(chip=>chip.id==='NET-R-T1-H1'));
  assert.match(await page.locator('.ss-composer-chips').innerText(),/Terminal-01 → 198.51.100.42/);
  detail=page.locator('.ss-entity-detail');
  await detail.locator('[data-action="super-graph-evidence"]').click();
  const evidenceState=await snap();
  assert.equal(evidenceState.activeTab,'文档空间');
  assert.equal(evidenceState.ui.highlightArtifact,'NET-TERMINAL-01-6');
  assert(evidenceState.ui.expandedFolders.includes('03 终端画像'));
  assert(evidenceState.ui.expandedFolders.includes('03 终端画像/Terminal-01'));
  assert.match(await page.getByRole('dialog').innerText(),/历史IP清单.xlsx/);
  await click('close');
  assert(await page.locator('[data-artifact-id="NET-TERMINAL-01-6"].is-highlighted').isVisible());

  await tab('导图空间');
  await page.locator('[data-action="node-select"][data-id="NET-TERMINAL-01"]').click();
  assert.match(await page.locator('.ss-entity-detail').innerText(),/7e2a8f5c0d8b43f3aa17c910d44b6e52/);
  assert.match(await page.locator('.ss-entity-detail').innerText(),/重点嫌疑终端/);
  await page.locator('.ss-entity-detail [data-action="super-graph-context"]').click();
  assert((await snap()).ui.contextChips.some(chip=>chip.id==='NET-TERMINAL-01'));

  const beforeRecommendation=(await snap()).queries.length;
  await page.locator('.ss-suggested-query').first().click();
  assert.match(await page.locator('#super-search-prompt').inputValue(),/继续分析两个重点终端登录的网络账号/);
  assert.equal((await snap()).queries.length,beforeRecommendation);

  for(const width of [1440,1680,1920,2048]){
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
    const metrics=await page.evaluate(()=>{const card=document.querySelector('.ss-task-detail-card'),center=document.querySelector('.ss-center'),input=document.querySelector('.ss-composer-dock');return {cardRight:card.getBoundingClientRect().right,centerRight:center.getBoundingClientRect().right,inputBottom:input.getBoundingClientRect().bottom}});
    assert(metrics.cardRight<=metrics.centerRight+1,`card ${width}`);
    assert(metrics.inputBottom<=1001,`input ${width}`);
    await page.screenshot({path:path.join(out,`layout-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1680,height:1000});
  await page.locator('[data-action="super-pane-collapse"][data-pane="right"]').filter({visible:true}).first().click();
  assert.equal(await page.locator('.super-search-page.ss-right-collapsed').count(),1);
  await page.locator('[data-action="super-pane-expand"][data-pane="right"]').filter({visible:true}).first().click();
  assert.equal(await page.locator('.super-search-page.ss-right-collapsed').count(),0);
  await page.waitForTimeout(300);
  const handle=page.locator('.ss-workspace-resizer');
  const handleBox=await handle.boundingBox();
  const beforeWidth=await page.locator('.ss-workspace-rail').evaluate(element=>element.clientWidth);
  await page.mouse.move(handleBox.x+4,handleBox.y+60);
  await page.mouse.down();
  await page.mouse.move(handleBox.x-88,handleBox.y+60,{steps:8});
  await page.mouse.up();
  assert((await snap()).ui.workspaceWidth>beforeWidth+70,'workspace drag resize');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  const savedWidth=(await snap()).ui.workspaceWidth;
  await page.reload();
  assert.equal((await snap()).ui.workspaceWidth,savedWidth);
  assert.equal((await snap()).query.status,'done');

  await page.setViewportSize({width:390,height:844});
  const drawerButton=page.locator('[data-action="super-pane-expand"][data-pane="right"]').filter({visible:true}).first();
  await drawerButton.click();
  assert(await page.getByRole('dialog').isVisible());
  assert(await page.locator('#overlay .ss-workspace').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:path.join(out,'mobile-drawer-390.png'),fullPage:true});

  await page.setViewportSize({width:1680,height:1000});
  await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.theme='dark';save()});
  await page.reload();
  await page.screenshot({path:path.join(out,'dark-1680.png'),fullPage:true});

  const historicalEvidence={artifacts:(await snap()).artifacts.length,entities:(await snap()).entities.length,relations:(await snap()).relations.length};
  await page.locator('#super-search-prompt').fill('继续核验疑似窝点证据');
  await page.locator('#super-search-composer [type="submit"]').click();
  const follow=await snap();
  assert.equal(follow.queries.length,2);
  assert(follow.query.historicalFollowup);
  assert.match(follow.query.finalConclusion,/没有新增终端、IP、Wi-Fi、位置或研判结论/);
  assert.deepEqual({artifacts:follow.artifacts.length,entities:follow.entities.length,relations:follow.relations.length},historicalEvidence);
  assert.equal(follow.query.status,'done');

  assert.deepEqual(errors,[]);
  const result={status:'PASS',session:'SS-NET-20260926-0148',singleTaskCard:true,subtasks:6,visibleActions:19,artifacts:41,entities:22,relations:27,widths:[1440,1680,1920,2048],mobile:390,errors};
  await fs.writeFile(path.join(out,'ui-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
