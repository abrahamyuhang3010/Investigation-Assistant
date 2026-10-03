import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(rootDir, 'docs/design-audit-2026-10-02/evidence/prompt-05');
await fs.mkdir(output, { recursive: true });
const browser = await pw.chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'chrome' });
const results = [];
const runtimeErrors = [];

async function surface(viewport = { width: 1363, height: 936 }) {
  const context = await browser.newContext({ viewport, colorScheme: 'light' });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', error => runtimeErrors.push(error.message));
  return { context, page };
}

async function record(id, name, fn) {
  try {
    await fn();
    results.push({ id, name, status: 'PASS' });
    console.log(`PASS ${id} ${name}`);
  } catch (error) {
    results.push({ id, name, status: 'FAIL', error: error.stack });
    console.error(`FAIL ${id} ${name}\n${error.stack}`);
  }
}

async function openCaseGraph(page) {
  await page.goto(`${base}/#/PG12`);
  await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
  await page.locator('.cd-detail').waitFor();
  await page.locator('[data-action="case-stage"][data-step="3"]').click();
  await page.locator('[data-graph="case-detail-CASE-0817"]').waitFor();
}

async function openEventGraph(page, taskName = 'Task2026090001') {
  await page.goto(`${base}/#/PG14`);
  const host = page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  const row = host.locator('#task-rows tr').filter({ hasText: taskName });
  await row.locator('[data-action="task-detail"]').click();
  await host.locator('#task-detail-drawer').waitFor({ state: 'visible' });
  await host.locator('[data-action="enter-graph"]').click();
  await host.locator('#graph-page').waitFor({ state: 'visible' });
  return host;
}

async function assertInsideViewport(locator, viewport) {
  const box = await locator.boundingBox();
  assert(box, '目标容器没有可测量边界');
  assert(box.x >= -1 && box.y >= -1, JSON.stringify(box));
  assert(box.x + box.width <= viewport.width + 1, JSON.stringify({ box, viewport }));
  assert(box.y + box.height <= viewport.height + 1, JSON.stringify({ box, viewport }));
}

await record('P05-R15-STEPS', '五步骤的语义选中与视觉选中保持一致', async () => {
  const { context, page } = await surface();
  try {
    await page.goto(`${base}/#/PG12`);
    await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
    await page.locator('.cd-stage-nav').waitFor();
    assert.equal(await page.locator('#case-stage-content').count(), 1);
    for (let step = 0; step < 5; step += 1) {
      const target = page.locator(`[data-action="case-stage"][data-step="${step}"]`);
      await target.click();
      assert.equal(await page.locator('.cd-stage-nav [aria-current="step"]').count(), 1);
      assert.equal(await target.getAttribute('aria-current'), 'step');
      assert.equal(await target.getAttribute('aria-controls'), 'case-stage-content');
      assert(await target.evaluate(node => node.matches('[aria-current="step"]')));
    }
    await page.screenshot({ path: path.join(output, 'pg13-five-step-current-light-1363x936.png') });
  } finally { await context.close(); }
});

await record('P05-R17', '笔录工具跟随内容且往返不重置阅读状态', async () => {
  const { context, page } = await surface();
  try {
    await page.goto(`${base}/#/PG12`);
    await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
    await page.locator('[data-action="case-stage"][data-step="2"]').click();
    const snapshot = () => page.evaluate(async () => {
      const { state } = await import('/src/state.js');
      const d = state.caseFlows[state.selectedCase].detail;
      return { transcriptId: d.transcriptId, page: d.page, zoom: d.zoom, transcriptCategory: d.transcriptCategory };
    });
    await page.locator('[data-action="cd-zoom"][data-delta="10"]').click();
    await page.locator('[data-action="cd-transcript-category"][data-id="net"]').click();
    const before = await snapshot();
    assert.equal(await page.locator('.cd-viewer-controls').count(), 1);
    await page.screenshot({ path: path.join(output, 'pg13-transcript-detail-light-1363x936.png') });

    await page.locator('[data-action="cd-viewer-tab"][data-id="qa"]').click();
    assert.equal(await page.locator('.cd-viewer-controls').count(), 0);
    await page.screenshot({ path: path.join(output, 'pg13-transcript-qa-light-1363x936.png') });

    await page.locator('[data-action="cd-result-tab"][data-id="basic"]').click();
    assert.equal(await page.locator('[data-action="cd-filter"]').count(), 0);
    assert.equal(await page.locator('[data-action="cd-add-entity"]').count(), 0);
    assert.equal(await page.locator('[data-action="cd-transcript-category"]').count(), 0);
    await page.screenshot({ path: path.join(output, 'pg13-transcript-basic-light-1363x936.png') });

    await page.locator('[data-action="cd-result-tab"][data-id="entities"]').click();
    assert.equal(await page.locator('[data-action="cd-filter"]').count(), 1);
    assert.equal(await page.locator('[data-action="cd-add-entity"]').count(), 1);
    assert((await page.locator('[data-action="cd-transcript-category"]').count()) > 1);
    await page.locator('[data-action="cd-viewer-tab"][data-id="detail"]').click();
    assert.deepEqual(await snapshot(), before);
    await page.screenshot({ path: path.join(output, 'pg13-transcript-entities-light-1363x936.png') });
  } finally { await context.close(); }
});

await record('P05-R10-PG13', 'PG13 实体详情抽屉保持资金 scope、导图状态与焦点', async () => {
  const viewport = { width: 1363, height: 936 };
  const { context, page } = await surface(viewport);
  try {
    await openCaseGraph(page);
    const graph = page.locator('[data-graph="case-detail-CASE-0817"]');
    const graphViewport = graph.locator('.entity-viewport');
    await page.locator('[data-action="node-zoom"][data-delta=".15"]').click();
    await graphViewport.evaluate(node => { node.scrollLeft = 170; node.scrollTop = 55; });
    const before = {
      scale: await graph.getAttribute('data-scale'),
      scroll: await graphViewport.evaluate(node => ({ left: node.scrollLeft, top: node.scrollTop }))
    };
    const trigger = page.locator('[data-node-id="bank-4"] [data-action="cd-entity"][data-id="bank-4"]').first();
    await trigger.click();
    const drawer = page.locator('.case-entity-detail-modal');
    await drawer.waitFor();
    assert.equal(await drawer.getAttribute('role'), 'dialog');
    assert.equal(await drawer.getAttribute('aria-modal'), 'true');
    const labelledBy = await drawer.getAttribute('aria-labelledby');
    assert(labelledBy && await drawer.locator(`#${labelledBy}`).count() === 1);
    assert.match(await drawer.locator(`#${labelledBy}`).innerText(), /^银行卡 · 尾号6071$/);
    assert.doesNotMatch(await drawer.locator(`#${labelledBy}`).innerText(), /6217000012346071/);
    const text = await drawer.innerText();
    assert.match(text, /当前实体交易明细/);
    assert.match(text, /共 2 条 · 合计 30,000\.00元/);
    assert.match(text, /关联材料中的其他账户记录/);
    assert.match(text, /不计入当前实体统计/);
    await assertInsideViewport(drawer, viewport);
    await page.screenshot({ path: path.join(output, 'pg13-bank-detail-light-1363x936.png') });

    const focusable = drawer.locator('button:not(:disabled):visible,input:not(:disabled):visible,select:visible,textarea:visible,a[href]:visible');
    const last = focusable.last();
    const first = focusable.first();
    await last.focus(); await page.keyboard.press('Tab');
    assert.equal(await first.evaluate(node => node === document.activeElement), true, 'Tab 应在抽屉内循环');
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'detached' });
    assert.equal(await trigger.evaluate(node => node === document.activeElement), true, '关闭后应返回原触发点');
    assert.equal(await graph.getAttribute('data-scale'), before.scale);
    assert.deepEqual(await graphViewport.evaluate(node => ({ left: node.scrollLeft, top: node.scrollTop })), before.scroll);

    await page.locator('.header [data-action="theme"]').click();
    await trigger.click();
    await page.screenshot({ path: path.join(output, 'pg13-bank-detail-dark-1363x936.png') });
    await page.keyboard.press('Escape');

    await page.setViewportSize({ width: 390, height: 700 });
    await trigger.click();
    await assertInsideViewport(page.locator('.case-entity-detail-modal'), { width: 390, height: 700 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(output, 'pg13-bank-detail-dark-390x700.png') });
  } finally { await context.close(); }
});

await record('P05-R15-PG13-MENU', 'PG13 节点菜单支持完整键盘路径', async () => {
  const { context, page } = await surface();
  try {
    await openCaseGraph(page);
    let trigger = page.locator('.node-more[data-id="bank-4"]');
    await trigger.click();
    const menu = page.locator('#entity-menu-bank-4');
    assert.equal(await menu.getAttribute('role'), 'menu');
    assert((await menu.locator('[role="menuitem"]').count()) >= 2);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await trigger.getAttribute('aria-controls'), 'entity-menu-bank-4');
    const items = menu.locator('[role="menuitem"]');
    assert.equal(await items.first().evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('End');
    assert.equal(await items.last().evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Home');
    assert.equal(await items.first().evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await items.nth(1).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('ArrowUp');
    assert.equal(await items.first().evaluate(node => node === document.activeElement), true);
    await page.screenshot({ path: path.join(output, 'pg13-node-menu-focus-light-1363x936.png') });
    await page.keyboard.press('Escape');
    trigger = page.locator('.node-more[data-id="bank-4"]');
    assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator('#entity-menu-bank-4').count(), 0);
  } finally { await context.close(); }
});

await record('P05-R14-PG12', 'PG12 筛选草稿、应用、取消、清除与保存当前视图语义准确', async () => {
  const { context, page } = await surface();
  try {
    await page.goto(`${base}/#/PG12`);
    const beforeRows = await page.locator('.case-table tbody tr').count();
    await page.locator('[data-action="case-filters"]').click();
    await page.locator('#case-advanced-filter select[name="caseType"]').selectOption({ label: '投资平台诈骗' });
    assert.equal(await page.locator('.case-table tbody tr').count(), beforeRows, '编辑草稿不能立即影响列表');
    await page.screenshot({ path: path.join(output, 'pg12-filter-draft-light-1363x936.png') });
    await page.locator('[data-action="case-cancel-filters"]').click();
    await page.locator('[data-action="case-filters"]').click();
    assert.equal(await page.locator('#case-advanced-filter select[name="caseType"]').inputValue(), '全部案件类型');
    await page.locator('#case-advanced-filter select[name="caseType"]').selectOption({ label: '投资平台诈骗' });
    await page.locator('[data-action="case-apply-filters"]').click();
    assert.match(await page.locator('.case-filter-summary').innerText(), /案件类型：投资平台诈骗/);
    await page.locator('[data-action="case-save-view"]').click();
    const saved = await page.evaluate(async () => (await import('/src/state.js')).state.caseList.saved);
    assert.equal(saved.filters.caseType, '投资平台诈骗');
    assert(Array.isArray(saved.columns) && saved.columns.length > 0);
    await page.locator('[data-action="case-filters"]').click();
    await page.locator('[data-action="case-clear-filters"]').click();
    assert.equal(await page.locator('.case-filter-summary').count(), 0);
  } finally { await context.close(); }
});

await record('P05-R10-PG14', 'PG14 详情按稳定实体 ID 展示独立交易范围且保持上下文', async () => {
  const viewport = { width: 1363, height: 936 };
  const { context, page } = await surface(viewport);
  try {
    let host = await openEventGraph(page, 'Task2026090001');
    const graphViewport = host.locator('#graph-viewport');
    await host.locator('[data-action="zoom-in"]').click();
    await graphViewport.evaluate(node => { node.scrollLeft = 140; node.scrollTop = 40; });
    const before = {
      scale: await host.locator('#map-panel').getAttribute('data-scale'),
      scroll: await graphViewport.evaluate(node => ({ left: node.scrollLeft, top: node.scrollTop }))
    };
    let trigger = host.locator('.graph-node [data-action="open-entity"][data-id="bank1"]');
    await trigger.click();
    let drawer = host.locator('#entity-drawer');
    assert.equal(await drawer.getAttribute('role'), 'dialog');
    assert.equal(await drawer.getAttribute('aria-modal'), 'true');
    assert.equal(await drawer.getAttribute('aria-labelledby'), 'entity-title');
    assert.equal((await host.locator('#entity-title').innerText()).trim(), '银行卡 · 尾号9359');
    assert.doesNotMatch(await host.locator('#entity-title').innerText(), /621700001064789359/);
    assert.match(await host.locator('#entity-scope').innerText(), /Task2026090001/);
    assert.match(await host.locator('#entity-scope').innerText(), /本地合成 fixture，未接入真实接口/);
    assert.match(await host.locator('#entity-transaction-summary').innerText(), /共 2 条 · 合计 42,000\.00元/);
    assert.equal(await host.locator('#entity-transaction-rows tr').count(), 2);
    assert.match(await host.locator('#entity-transaction-rows').innerText(), /EVT-0001-A/);
    await assertInsideViewport(drawer, viewport);
    await page.screenshot({ path: path.join(output, 'pg14-bank1-detail-light-1363x936.png') });
    await page.keyboard.press('Escape');
    assert.equal(await trigger.evaluate(node => node === node.getRootNode().activeElement), true, '关闭后应返回原实体按钮');
    assert.equal(await host.locator('#map-panel').getAttribute('data-scale'), before.scale);
    assert.deepEqual(await graphViewport.evaluate(node => ({ left: node.scrollLeft, top: node.scrollTop })), before.scroll);
    const ctxA = await page.evaluate(async () => (await import('/src/event-workflow.js')).eventWorkflowContext());
    assert.equal(ctxA.taskName, 'Task2026090001');

    await host.locator('.graph-node [data-action="open-entity"][data-id="network-wxid-zs001"]').click();
    assert.equal(await host.locator('#entity-transaction-rows tr').count(), 1);
    assert.match(await host.locator('#entity-transaction-rows').innerText(), /不会复用其他实体的银行卡交易记录/);
    assert.doesNotMatch(await host.locator('#entity-transaction-rows').innerText(), /EVT-0001-A/);
    await page.keyboard.press('Escape');

    await host.locator('[data-action="back-list"]').click();
    const rowB = host.locator('#task-rows tr').filter({ hasText: 'Task2026090002' });
    await rowB.locator('[data-action="task-detail"]').click();
    await host.locator('[data-action="enter-graph"]').click();
    trigger = host.locator('.graph-node [data-action="open-entity"][data-id="bank2"]');
    await trigger.click();
    assert.equal((await host.locator('#entity-title').innerText()).trim(), '银行卡 · 尾号0000');
    assert.match(await host.locator('#entity-scope').innerText(), /Task2026090002/);
    assert.match(await host.locator('#entity-transaction-summary').innerText(), /共 1 条 · 合计 50,000\.00元/);
    const bank2Rows = await host.locator('#entity-transaction-rows').innerText();
    assert.match(bank2Rows, /EVT-0002-A/);
    assert.doesNotMatch(bank2Rows, /EVT-0001-A|EVT-0001-B/);

    // The modal drawer correctly blocks background controls. Close it before switching
    // the global theme, then reopen the same stable-ID entity for dark-theme evidence.
    await page.keyboard.press('Escape');
    await page.locator('.header [data-action="theme"]').click();
    trigger = host.locator('.graph-node [data-action="open-entity"][data-id="bank2"]');
    await trigger.click();
    assert.equal((await host.locator('#entity-title').innerText()).trim(), '银行卡 · 尾号0000');
    assert.match(await host.locator('#entity-scope').innerText(), /Task2026090002/);
    assert.match(await host.locator('#entity-transaction-summary').innerText(), /共 1 条 · 合计 50,000\.00元/);
    await page.screenshot({ path: path.join(output, 'pg14-bank2-detail-dark-1363x936.png') });
    await page.setViewportSize({ width: 390, height: 700 });
    await assertInsideViewport(host.locator('#entity-drawer'), { width: 390, height: 700 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(output, 'pg14-bank2-detail-dark-390x700.png') });
  } finally { await context.close(); }
});

await record('P05-R15-PG14-MENU', 'PG14 节点菜单的 ARIA 关联与方向键、Home/End、Escape 正确', async () => {
  const { context, page } = await surface();
  try {
    const host = await openEventGraph(page);
    let trigger = host.locator('[data-action="card-menu"][data-id="bank1"]');
    await trigger.click();
    const menu = host.locator('#card-menu-bank1');
    assert.equal(await menu.getAttribute('role'), 'menu');
    assert.equal(await trigger.getAttribute('aria-haspopup'), 'menu');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await trigger.getAttribute('aria-controls'), 'card-menu-bank1');
    const items = menu.locator('[role="menuitem"]');
    assert((await items.count()) >= 3);
    assert.equal(await items.first().evaluate(node => node === node.getRootNode().activeElement), true);
    await page.keyboard.press('End');
    assert.equal(await items.last().evaluate(node => node === node.getRootNode().activeElement), true);
    await page.keyboard.press('Home');
    assert.equal(await items.first().evaluate(node => node === node.getRootNode().activeElement), true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await items.nth(1).evaluate(node => node === node.getRootNode().activeElement), true);
    await page.keyboard.press('ArrowUp');
    assert.equal(await items.first().evaluate(node => node === node.getRootNode().activeElement), true);
    await page.screenshot({ path: path.join(output, 'pg14-node-menu-focus-light-1363x936.png') });
    await page.keyboard.press('Escape');
    trigger = host.locator('[data-action="card-menu"][data-id="bank1"]');
    assert.equal(await trigger.evaluate(node => node === node.getRootNode().activeElement), true);
    assert.equal(await host.locator('#card-menu-bank1').count(), 0);
  } finally { await context.close(); }
});

await record('P05-R14-PG14', 'PG14 筛选草稿、应用、取消、清除和本机方案恢复准确', async () => {
  const { context, page } = await surface();
  try {
    const host = page.locator('event-workflow');
    await page.goto(`${base}/#/PG14`);
    await host.locator('#task-rows tr').first().waitFor();
    const beforeRows = await host.locator('#task-rows tr').count();
    await host.locator('[data-action="toggle-filter"]').click();
    await host.locator('[data-update="new"]').click();
    assert.equal(await host.locator('#task-rows tr').count(), beforeRows);
    await page.screenshot({ path: path.join(output, 'pg14-filter-draft-light-1363x936.png') });
    await host.locator('[data-action="cancel-filter"]').click();
    await host.locator('[data-action="toggle-filter"]').click();
    assert(await host.locator('[data-update="all"]').evaluate(node => node.classList.contains('selected')));
    await host.locator('[data-update="new"]').click();
    await host.locator('[data-action="apply-filter"]').click();
    assert.match(await host.locator('#applied-filter-summary').innerText(), /更新状态：有更新/);
    await host.locator('[data-action="save-filter"]').click();
    const saved = await host.evaluate(() => JSON.parse(localStorage.getItem('ypa-event-filter')));
    assert.equal(saved.update, 'new');
    await page.reload();
    await host.locator('#task-rows tr').first().waitFor();
    assert.match(await host.locator('#applied-filter-summary').innerText(), /更新状态：有更新/);
    await host.locator('[data-action="toggle-filter"]').click();
    await host.locator('[data-action="clear-advanced-filter"]').click();
    assert(await host.locator('#applied-filter-summary').isHidden());
  } finally { await context.close(); }
});

const report = {
  testedAt: new Date().toISOString(),
  viewport: ['1363x936', '390x700'],
  browserZoom: '100%',
  dataBoundary: '本地合成 fixture；未接入真实案件、资金、调证或权限接口。',
  figmaBoundary: '未获得可验证 revision 的最新 Figma；右侧 drawer 与 960px 桌面宽度为本轮实现决策。',
  summary: { passed: results.filter(item => item.status === 'PASS').length, failed: results.filter(item => item.status === 'FAIL').length },
  runtimeErrors,
  results
};
await fs.writeFile(path.join(output, 'prompt-05-results.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 2));
if (runtimeErrors.length || report.summary.failed) process.exitCode = 1;
