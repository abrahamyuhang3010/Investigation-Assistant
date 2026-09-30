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
const out=path.resolve('audit/person-history-v1');
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
  assert(!sessionsBeforeOpen.some(session=>session.id==='SS-PERSON-20260924-0017'),'Sidebar render must keep the person fixture virtual');
  const historyRow=page.locator('[data-action="super-session-open"][data-id="SS-PERSON-20260924-0017"]');
  assert(await historyRow.isVisible());
  const historyText=(await historyRow.innerText()).trim();
  assert.match(historyText,/嫌疑人陈骏近30天活动轨迹及潜藏地研判/);
  assert.doesNotMatch(historyText,/已完成 · 人员研判/);
  await historyRow.click();
  const sessionsAfterOpen=await page.evaluate(async()=>structuredClone((await import('/src/state.js')).state.sessions));
  assert.equal(sessionsAfterOpen.length,sessionsBeforeOpen.length+1);
  assert.equal(sessionsAfterOpen.filter(session=>session.id==='SS-PERSON-20260924-0017').length,1,'Opening the row materializes exactly one historical session');

  const first=await snap();
  assert.equal(first.fixture,'person-v1');
  assert.equal(first.query.id,'TASK-PERSON-20260924-0017');
  assert.equal(first.query.status,'done');
  assert.equal(first.query.planVersion,1);
  assert.equal(first.query.replanCount,0);
  assert.equal(first.queries.length,1);
  assert.equal(await page.locator('.ss-task-detail-card').count(),1);
  assert.equal(await page.locator('.ss-subtask').count(),6);
  assert.equal(await page.locator('.ss-tool').count(),14);
  assert.equal(await page.locator('.ss-agent-card').count(),2);
  assert.equal(await page.locator('.ss-permission-batch').count(),0);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/6 \/ 6 子任务已完成/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/查看人员关系图/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/第一潜藏地候选/);
  assert.match(await page.locator('.ss-task-detail-card').innerText(),/重点核验/);
  for(const forbiddenCard of ['身份卡','手机号发现卡','设备发现卡','轨迹卡','高频区域卡','潜藏地卡','FinalResultCard']){
    assert.equal(await page.locator('.ss-task-detail-card').getByText(forbiddenCard,{exact:true}).count(),0,forbiddenCard);
  }
  const planText=await page.locator('.ss-task-subtasks').innerText();
  for(const leaked of ['17600004182','176****4182','18900006731','189****6731','DVC-7F3C9A21','DVC-192E0B63','星澜智寓','澄湾数字产业园','景澜商务酒店','1207']){
    assert(!planText.includes(leaked),`Initial Plan leaks ${leaked}`);
  }
  assert.equal(await page.evaluate(async()=>{const model=await import('/src/super-search-model.js');return model.tickSuperSearch(Date.now()+60000)}),false);
  assert.deepEqual((await snap()).query.events,first.query.events,'Historical session must not auto-run or replay');
  await page.screenshot({path:path.join(out,'history-1680.png'),fullPage:true});

  await click('super-task-source','PERSON-ST-03');
  assert.equal((await snap()).activeTab,'工作空间');
  assert.equal((await snap()).ui.highlightTool,'ACT-PERSON-005');

  for(const [id,expected] of [
    ['ACT-PERSON-004',/动态发现2个可信手机号/],
    ['ACT-PERSON-005',/DVC-7F3C9A21/],
    ['ACT-PERSON-007',/星澜智寓3栋1207/],
  ]){
    const tool=page.locator(`[data-tool-id="${id}"]`);
    if(!await tool.locator('.ss-tool-detail').count())await click('super-tool-toggle',id);
    assert.equal(await tool.locator('[role="tab"]').count()>=3,true,`${id} historical Action tabs`);
    await tool.locator('[data-tab="输出结果"]').click();
    assert.match(await tool.innerText(),expected,id);
  }

  const a07=page.locator('[data-tool-id="ACT-PERSON-007"]');
  await a07.locator('[data-action="super-artifact-focus"][data-id="ART-PERSON-MT-176"]').click();
  assert.equal((await snap()).activeTab,'文档空间');
  assert.equal((await snap()).ui.highlightArtifact,'ART-PERSON-MT-176');
  assert(await page.locator('[data-artifact-id="ART-PERSON-MT-176"].is-highlighted').isVisible());

  await click('super-file-preview','ART-PERSON-REPORT');
  assert.equal((await snap()).activeTab,'文档空间');
  const reportDialog=page.getByRole('dialog');
  assert.match(await reportDialog.innerText(),/陈骏_人员研判报告.md/);
  assert.match(await reportDialog.innerText(),/第一潜藏地候选/);
  assert.match(await reportDialog.innerText(),/1207室为重点核验地址/);
  assert.match(await reportDialog.innerText(),/前端 Mock|虚构模拟/);
  assert(!/已确认居住地|已确认潜藏地|确认藏匿/.test(await reportDialog.innerText()));
  await click('close');

  await tab('文档空间');
  const rootFolder=page.locator('[data-action="super-folder-toggle"][data-id="TASK-PERSON-20260924-0017"]');
  if(await rootFolder.getAttribute('aria-expanded')==='false')await rootFolder.click();
  const treeText=await page.locator('.ss-file-tree').innerText();
  for(const folderName of ['01 人员统一档案','02 手机号与设备','03 生活轨迹','04 地址提取与归一','05 轨迹与活动分析','06 最终报告'])assert(treeText.includes(folderName),folderName);
  assert((await page.locator('.ss-file-folder-child').count())>=7,'Task output tree contains the required nested folders');

  await tab('导图空间');
  assert.equal((await snap()).entities.length,13);
  assert.equal((await snap()).relations.length,17);
  assert.equal(await page.locator('.ss-relation-list [data-action="super-relation-detail"]').count(),17);
  await page.locator('[data-action="node-select"][data-id="PHONE-176"]').click();
  assert.match(await page.locator('.ss-entity-detail').innerText(),/176\*{4}4182/);
  assert.match(await page.locator('.ss-entity-detail').innerText(),/手机号/);
  const queriesBeforeContext=(await snap()).queries.length;
  await page.locator('.ss-entity-detail [data-action="super-graph-context"]').click();
  assert((await snap()).ui.contextChips.some(chip=>chip.id==='PHONE-176'));
  assert.equal((await snap()).queries.length,queriesBeforeContext,'Graph context adds a chip without sending');
  await tab('导图空间');
  await page.locator('.ss-relation-list [data-action="super-relation-detail"][data-id="PERSON-R-HIDEOUT"]').click();
  assert.match(await page.locator('.ss-entity-detail').innerText(),/第一潜藏地候选/);
  await page.locator('.ss-entity-detail [data-action="super-graph-evidence"]').click();
  const evidenceState=await snap();
  assert.equal(evidenceState.activeTab,'文档空间');
  assert.equal(evidenceState.ui.highlightArtifact,'ART-PERSON-REASONING');
  assert.match(await page.getByRole('dialog').innerText(),/已在文档空间定位第一条证据/);
  assert.match(await page.getByRole('dialog').innerText(),/hideout_reasoning.md/);
  await click('close');
  assert(await page.locator('[data-artifact-id="ART-PERSON-REASONING"].is-highlighted').isVisible());

  await tab('工作空间');
  const queriesBeforeRecommendation=(await snap()).queries.length;
  await page.locator('.ss-suggested-query').first().click();
  assert.match(await page.locator('#super-search-prompt').inputValue(),/星澜智寓3栋附近的全部位置证据/);
  assert.equal((await snap()).queries.length,queriesBeforeRecommendation,'Recommendation only fills the composer');

  for(const width of [1440,1680,1920,2048]){
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
    const metrics=await page.evaluate(()=>{const card=document.querySelector('.ss-task-detail-card'),center=document.querySelector('.ss-center'),input=document.querySelector('.ss-composer-dock');return {cardRight:card.getBoundingClientRect().right,centerRight:center.getBoundingClientRect().right,inputBottom:input.getBoundingClientRect().bottom}});
    assert(metrics.cardRight<=metrics.centerRight+1,`task card fits center at ${width}`);
    assert(metrics.inputBottom<=1001,`composer remains in viewport at ${width}`);
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
  assert((await snap()).ui.workspaceWidth>beforeWidth+70,'Workspace drag resize persists a wider rail');
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
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:path.join(out,'mobile-drawer-390.png'),fullPage:true});
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);

  await page.setViewportSize({width:1680,height:1000});
  await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.theme='dark';save()});
  await page.reload();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
  await page.screenshot({path:path.join(out,'dark-1680.png'),fullPage:true});

  const historicalEvidence={artifacts:(await snap()).artifacts.length,entities:(await snap()).entities.length,relations:(await snap()).relations.length};
  await page.locator('#super-search-prompt').fill('继续核验星澜智寓3栋附近的疑似落脚证据');
  await page.locator('#super-search-composer [type="submit"]').click();
  const follow=await snap();
  assert.equal(follow.queries.length,2);
  assert(follow.query.historicalFollowup);
  assert.match(follow.query.finalConclusion,/没有新增手机号、设备、位置、Artifact 或研判结论/);
  assert.deepEqual({artifacts:follow.artifacts.length,entities:follow.entities.length,relations:follow.relations.length},historicalEvidence);
  assert.equal(follow.query.status,'done');

  assert.deepEqual(errors,[]);
  const result={status:'PASS',session:'SS-PERSON-20260924-0017',singleTaskCard:true,subtasks:6,visibleActions:14,agents:2,artifacts:15,entities:13,relations:17,widths:[1440,1680,1920,2048],mobile:390,darkTheme:true,errors};
  await fs.writeFile(path.join(out,'ui-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
