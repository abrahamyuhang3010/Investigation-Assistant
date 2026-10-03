import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'docs/design-audit-2026-10-02/evidence/prompt-07');
await fs.mkdir(output, {recursive:true});
const browser = await pw.chromium.launch({headless:true, channel:process.env.PW_CHANNEL || 'chrome'});
const results = [];
const runtimeErrors = [];
const screenshots = [];

async function surface(viewport, colorScheme='light') {
  const context = await browser.newContext({viewport, colorScheme});
  await context.addInitScript(() => localStorage.clear());
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  page.on('pageerror', error => runtimeErrors.push(error.message));
  return {context, page};
}
async function record(id, name, fn) {
  const before = runtimeErrors.length;
  try {
    await fn();
    assert.equal(runtimeErrors.length, before, `浏览器运行时错误：${runtimeErrors.slice(before).join('; ')}`);
    results.push({id,name,status:'PASS'});
    console.log(`PASS ${id} ${name}`);
  } catch (error) {
    results.push({id,name,status:'FAIL',error:error.stack});
    console.error(`FAIL ${id} ${name}\n${error.stack}`);
  }
}
async function shot(page, file, meta={}) {
  await page.screenshot({path:path.join(output,file)});
  screenshots.push({file,...meta});
}
async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({width:innerWidth, documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth}));
  assert(metrics.documentWidth <= metrics.width + 1, `${label} 页面横向溢出：${JSON.stringify(metrics)}`);
  assert(metrics.bodyWidth <= metrics.width + 1, `${label} body横向溢出：${JSON.stringify(metrics)}`);
}
async function assertInsideViewport(locator, viewport, label) {
  const box = await locator.boundingBox();
  assert(box, `${label} 无边界`);
  assert(box.x >= -1 && box.y >= -1, `${label} 越过左/上边界：${JSON.stringify(box)}`);
  assert(box.x + box.width <= viewport.width + 1, `${label} 越过右边界：${JSON.stringify({box,viewport})}`);
  assert(box.y + box.height <= viewport.height + 1, `${label} 越过下边界：${JSON.stringify({box,viewport})}`);
}
async function openCaseGraph(page) {
  await page.goto(`${base}/#/PG12`);
  await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
  await page.locator('.cd-detail').waitFor();
  await page.locator('[data-action="case-stage"][data-step="3"]').click();
  await page.locator('[data-graph="case-detail-CASE-0817"]').waitFor();
}
async function openEventGraph(page, task='Task2026090001') {
  await page.goto(`${base}/#/PG14`);
  const host = page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  const row = host.locator('#task-rows tr').filter({hasText:task});
  await row.locator('[data-action="task-detail"]').click();
  await host.locator('[data-action="enter-graph"]').click();
  await host.locator('#graph-page').waitFor({state:'visible'});
  return host;
}
async function setDark(page) {
  if (await page.locator('html').getAttribute('data-theme') !== 'dark') await page.locator('.header [data-action="theme"]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
}

await record('P07-NAV', '从真实主导航进入PG12、PG13与PG14，不依赖功能总览', async () => {
  const viewport={width:1363,height:936};
  const {context,page}=await surface(viewport);
  try {
    await page.goto(`${base}/#/PG02`);
    await page.locator('.case-workbench-toggle').click();
    await page.locator('#case-workbench-list a[href="#/PG12"]').click();
    await page.locator('.case-table').waitFor();
    assert.match(page.url(),/#\/PG12$/);
    await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
    await page.locator('.cd-detail').waitFor();
    assert.match(page.url(),/#\/PG13$/);
    for (let step=0; step<5; step+=1) {
      const control=page.locator(`[data-action="case-stage"][data-step="${step}"]`);
      await control.click();
      assert.equal(await control.getAttribute('aria-current'),'step');
    }
    await page.locator('.case-workbench-toggle').click();
    await page.locator('#case-workbench-list a[href="#/PG14"]').click();
    const host=page.locator('event-workflow');
    await host.locator('#task-rows tr').first().waitFor();
    assert.match(page.url(),/#\/PG14$/);
    await assertNoPageOverflow(page,'真实导航PG14');
  } finally { await context.close(); }
});

await record('P07-PG12', 'PG12列表与新建表单覆盖基线、深色和1280×800', async () => {
  const baseViewport={width:1363,height:936};
  let session=await surface(baseViewport);
  try {
    await session.page.goto(`${base}/#/PG12`);
    await session.page.locator('.case-table').waitFor();
    await assertNoPageOverflow(session.page,'PG12 1363×936');
    await shot(session.page,'pg12-list-light-1363x936.png',{route:'PG12',theme:'light',viewport:baseViewport});
  } finally { await session.context.close(); }

  const viewport={width:1280,height:800};
  session=await surface(viewport);
  try {
    await session.page.goto(`${base}/#/PG12`);
    await setDark(session.page);
    await session.page.locator('[data-action="case-create"]').click();
    await session.page.locator('#overlay .modal').waitFor();
    await assertInsideViewport(session.page.locator('#overlay .modal'),viewport,'PG12新建弹窗');
    await assertInsideViewport(session.page.locator('#overlay .form-actions'),viewport,'PG12新建操作区');
    await assertNoPageOverflow(session.page,'PG12新建深色1280×800');
    await shot(session.page,'pg12-create-dark-1280x800.png',{route:'PG12',theme:'dark',viewport});
  } finally { await session.context.close(); }
});

await record('P07-PG13', 'PG13导图、实体详情与来源预览覆盖1440/1363及浅深主题', async () => {
  const graphViewport={width:1440,height:900};
  let session=await surface(graphViewport);
  try {
    await openCaseGraph(session.page);
    await assertNoPageOverflow(session.page,'PG13导图1440×900');
    const width=await session.page.locator('[data-node-id="bank-4"]').evaluate(node=>parseFloat(getComputedStyle(node).width));
    assert(Math.abs(width-322)<1,`PG13原始卡片宽应保持322px，实际${width}`);
    await shot(session.page,'pg13-graph-light-1440x900.png',{route:'PG13',scene:'graph',theme:'light',viewport:graphViewport});
    const trigger=session.page.locator('[data-node-id="bank-4"] [data-action="cd-entity"][data-id="bank-4"]').first();
    await trigger.click();
    await assertInsideViewport(session.page.locator('.case-entity-detail-modal'),graphViewport,'PG13实体详情');
    assert.match(await session.page.locator('.case-entity-detail-modal').innerText(),/共 2 条 · 合计 30,000\.00元/);
  } finally { await session.context.close(); }

  const citationViewport={width:1363,height:936};
  session=await surface(citationViewport);
  try {
    await session.page.goto(`${base}/#/PG12`);
    await setDark(session.page);
    await session.page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
    await session.page.locator('[data-action="case-stage"][data-step="4"]').click();
    const citation=session.page.locator('.cd-report-paper [data-action="cd-report-source"][data-citation-id="C3-2"]');
    await citation.click();
    await session.page.locator('.cd-citation-preview').waitFor();
    assert.equal(await session.page.locator('.cd-citation-source-list [data-action="cd-report-source-select"]').count(),2);
    await assertInsideViewport(session.page.locator('#overlay .modal'),citationViewport,'PG13来源预览');
    await assertNoPageOverflow(session.page,'PG13来源预览深色');
    await shot(session.page,'pg13-citation-dark-1363x936.png',{route:'PG13',scene:'citation',theme:'dark',viewport:citationViewport});
  } finally { await session.context.close(); }
});

await record('P07-PG14', 'PG14列表、导图、任务切换与实体详情覆盖1280/1440/1363及浅深主题', async () => {
  let viewport={width:1280,height:800};
  let session=await surface(viewport);
  try {
    await session.page.goto(`${base}/#/PG14`);
    const host=session.page.locator('event-workflow');
    await host.locator('#task-rows tr').first().waitFor();
    await assertNoPageOverflow(session.page,'PG14列表1280×800');
    await shot(session.page,'pg14-list-light-1280x800.png',{route:'PG14',scene:'list',theme:'light',viewport});
  } finally { await session.context.close(); }

  viewport={width:1440,height:900};
  session=await surface(viewport);
  try {
    const host=await openEventGraph(session.page,'Task2026090001');
    await setDark(session.page);
    assert.match(await host.locator('#map-panel').innerText(),/wxid_zs001/);
    assert.doesNotMatch(await host.locator('#map-panel').innerText(),/微信账号 AbMen/);
    const width=await host.locator('.graph-node[data-node="network-wxid-zs001"]').evaluate(node=>parseFloat(getComputedStyle(node).width));
    assert(Math.abs(width-322)<1,`PG14原始卡片宽应保持322px，实际${width}`);
    await assertNoPageOverflow(session.page,'PG14导图1440×900');
    await shot(session.page,'pg14-graph-dark-1440x900.png',{route:'PG14',scene:'graph',theme:'dark',viewport});
    await host.locator('[data-action="back-list"]').click();
    const taskB=host.locator('#task-rows tr').filter({hasText:'Task2026090002'});
    await taskB.locator('[data-action="task-detail"]').click();
    await host.locator('[data-action="enter-graph"]').click();
    assert.match(await host.locator('#map-panel').innerText(),/AbMen/);
    assert.doesNotMatch(await host.locator('#map-panel').innerText(),/wxid_zs001/);
  } finally { await session.context.close(); }

  viewport={width:1363,height:936};
  session=await surface(viewport);
  try {
    const host=await openEventGraph(session.page,'Task2026090001');
    await setDark(session.page);
    await host.locator('.graph-node [data-action="open-entity"][data-id="bank1"]').click();
    await assertInsideViewport(host.locator('#entity-drawer'),viewport,'PG14实体详情');
    assert.match(await host.locator('#entity-scope').innerText(),/Task2026090001/);
    assert.match(await host.locator('#entity-transaction-summary').innerText(),/共 2 条 · 合计 42,000\.00元/);
    await assertNoPageOverflow(session.page,'PG14实体详情深色');
    await shot(session.page,'pg14-entity-dark-1363x936.png',{route:'PG14',scene:'entity-detail',theme:'dark',viewport});
  } finally { await session.context.close(); }
});

await record('P07-MOBILE', '现有手机断点下表单和实体详情可达且页面不意外横向溢出', async () => {
  const viewport={width:390,height:700};
  let session=await surface(viewport);
  try {
    await session.page.goto(`${base}/#/PG12`);
    await session.page.locator('[data-action="case-create"]').click();
    await assertInsideViewport(session.page.locator('#overlay .modal'),viewport,'手机PG12新建弹窗');
    await assertInsideViewport(session.page.locator('#overlay .form-actions'),viewport,'手机PG12操作区');
    await assertNoPageOverflow(session.page,'手机PG12新建');
    await shot(session.page,'pg12-create-light-390x700.png',{route:'PG12',scene:'create',theme:'light',viewport});
  } finally { await session.context.close(); }

  session=await surface(viewport);
  try {
    const host=await openEventGraph(session.page,'Task2026090002');
    await host.locator('.graph-node [data-action="open-entity"][data-id="bank2"]').click();
    await assertInsideViewport(host.locator('#entity-drawer'),viewport,'手机PG14实体详情');
    await assertNoPageOverflow(session.page,'手机PG14实体详情');
    await shot(session.page,'pg14-entity-light-390x700.png',{route:'PG14',scene:'entity-detail',theme:'light',viewport});
  } finally { await session.context.close(); }
});

await browser.close();
const status=results.every(item=>item.status==='PASS') && runtimeErrors.length===0 ? 'PASS' : 'FAIL';
await fs.writeFile(path.join(output,'prompt-07-results.json'),JSON.stringify({status,results,runtimeErrors},null,2));
await fs.writeFile(path.join(output,'screenshot-metadata.json'),JSON.stringify({capturedAt:'2026-10-03',base,screenshots},null,2));
await fs.writeFile(path.join(output,'test-results.md'),`# Prompt 07 浏览器回归\n\n- 日期：2026-10-03\n- 地址：${base}\n- 结果：${status}\n- 截图：${screenshots.length} 张\n\n${results.map(item=>`- ${item.status === 'PASS' ? 'PASS' : 'FAIL'} ${item.id}：${item.name}${item.error?`\n  - ${item.error.split('\n')[0]}`:''}`).join('\n')}\n`);
console.log(`${status} ${results.filter(item=>item.status==='PASS').length}/${results.length} Prompt 07 browser groups`);
if(status!=='PASS') process.exitCode=1;
