import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../audit/event-workflow-correction-2026-10-01');
await fs.mkdir(output, { recursive: true });

const browser = await pw.chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport: { width: 1288, height: 824 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(`${base}/#/PG14`);
await page.locator('event-workflow').waitFor();
const frame = page.locator('event-workflow');
await frame.locator('#task-rows tr').first().waitFor();

const click = async (action, selector = '') => {
  await frame.locator(`[data-action="${action}"]${selector}`).first().click();
  await page.waitForTimeout(60);
};
const assertVisible = selector => assert(frame.locator(selector).isVisible());
const toastText = () => frame.locator('#event-toast').innerText();
const openTask = async name => { const row=frame.locator('#task-rows tr').filter({hasText:name}); await row.locator('[data-action=task-detail]').click(); await page.waitForTimeout(60); };

const results = [];
async function test(id, name, fn) {
  const before = errors.length;
  try {
    await fn();
    assert.equal(errors.length, before, '浏览器运行时出现错误');
    results.push({ id, name, status: 'PASS' });
  } catch (error) {
    results.push({ id, name, status: 'FAIL', error: error.message });
    await page.screenshot({ path: path.join(output, `FAIL-${id}.png`), fullPage: true });
    throw error;
  }
}

await test('EW01', '任务搜索、筛选、重置与保存', async () => {
  assert.equal(await frame.locator('#task-rows tr').count(), 7);
  assert.equal(await frame.locator('.panel-heading').count(), 0);
  assert.equal((await frame.locator('#table-count').innerText()).trim(), '共 7 条');
  assert(!/研判任务|围绕实体线索|仅本地合成记录|当前全部展示/.test(await frame.locator('.task-panel').innerText()));
  await frame.locator('#task-search').fill('不存在的任务');
  assert.equal(await frame.locator('#task-rows tr').count(), 0);
  assert(await frame.locator('#task-empty').isVisible());
  await frame.locator('#task-search').fill('Task');
  assert.equal(await frame.locator('#task-rows tr').count(), 7);
  await click('toggle-filter');
  await frame.locator('[data-update="new"]').click();
  assert.equal(await frame.locator('#task-rows tr').count(), 7, '编辑筛选草稿不应立即改变列表');
  await click('cancel-filter');
  assert.equal(await frame.locator('#task-rows tr').count(), 7, '取消不应应用草稿');
  await click('toggle-filter');
  assert(await frame.locator('[data-update="all"]').evaluate(node => node.classList.contains('selected')), '再次打开时草稿应从已应用条件初始化');
  await frame.locator('[data-update="new"]').click();
  await click('apply-filter');
  const filteredCount = await frame.locator('#task-rows tr').count();
  assert(filteredCount > 0 && filteredCount < 7);
  assert.match(await frame.locator('#applied-filter-summary').innerText(), /更新状态：有更新/);
  await click('save-filter');
  assert((await toastText()).includes('筛选方案已保存到本机'));
  const saved = await frame.evaluate(() => JSON.parse(localStorage.getItem('ypa-event-filter')));
  assert.equal(saved.update, 'new');
  await click('toggle-filter');
  await click('clear-advanced-filter');
  assert.equal(await frame.locator('#task-rows tr').count(), 7);
  assert(await frame.locator('#applied-filter-summary').isHidden());
  await click('reset-filter');
  assert.equal(await frame.locator('#task-rows tr').count(), 7);
});

await test('EW02', '稳定任务根实体与任务切换隔离', async () => {
  await openTask('Task2026090001');
  assert(await frame.locator('#task-detail-drawer').isVisible());
  assert.match(await frame.locator('#task-detail-fields').innerText(),/微信账号 wxid_zs001/);
  await click('edit-task');
  assert(await frame.locator('#task-edit-drawer').isVisible());
  assert.match(await frame.locator('#task-edit-form [name="entity"]').inputValue(),/wxid_zs001/);
  await frame.locator('#task-edit-form [name="note"]').fill('合成数据交互验收记录');
  await frame.locator('#task-edit-form [type="submit"]').click();
  assert(await frame.locator('#task-detail-drawer').isVisible());
  assert((await frame.locator('#task-detail-fields').innerText()).includes('合成数据交互验收记录'));
  await click('enter-graph');
  assert(await frame.locator('#graph-page').isVisible());
  assert.equal(await frame.locator('.graph-node').count(),3);
  assert(await frame.locator('[data-node="network-wxid-zs001"]').isVisible());
  assert.equal(await frame.locator('[data-node="network-abmen"]').count(),0);
  await click('back-list');
  await openTask('Task2026090002');await click('enter-graph');
  assert(await frame.locator('[data-node="network-abmen"]').isVisible());
  assert.equal(await frame.locator('[data-node="network-wxid-zs001"]').count(),0);
  assert.equal(await frame.locator('#entity-drawer:not([hidden]),.card-menu').count(),0);
  await click('back-list');await openTask('Task2026090001');await click('enter-graph');
  assert(await frame.locator('[data-node="network-wxid-zs001"]').isVisible());
  assert.equal(await frame.locator('[data-node="network-abmen"]').count(),0);
});

await test('EW-R04', '银行卡、人员、网络账号编辑正确回填且取消不污染', async () => {
  const editEntity=async(id,expected,next=expected)=>{
    await frame.locator(`[data-action="card-menu"][data-id="${id}"]`).click();
    await frame.locator(`[data-action="card-edit"][data-id="${id}"]`).click();
    assert.equal(await frame.locator('#child-account').inputValue(),expected);
    await frame.locator('#child-account').fill('********');
    await frame.locator('#child-dialog [data-action="close-dialog"]').last().click();
    await frame.locator(`[data-action="card-menu"][data-id="${id}"]`).click();
    await frame.locator(`[data-action="card-edit"][data-id="${id}"]`).click();
    assert.equal(await frame.locator('#child-account').inputValue(),expected);
    await frame.locator('#child-account').fill(next);
    await frame.locator('#child-dialog [data-action="save-child"]').click();
    assert.equal(await frame.locator(`[data-node="${id}"]`).count(),1);
    await frame.locator(`[data-action="card-menu"][data-id="${id}"]`).click();
    await frame.locator(`[data-action="card-edit"][data-id="${id}"]`).click();
    assert.equal(await frame.locator('#child-account').inputValue(),next);
    await frame.locator('#child-account').fill('****');
    await frame.locator('#child-dialog [data-action="save-child"]').click();
    assert.match(await toastText(),/格式不正确/);
    assert(await frame.locator('#child-dialog').isVisible());
    await frame.locator('#child-dialog [data-action="close-dialog"]').last().click();
  };
  await editEntity('bank1','621700001064789359','000123456789012345');
  await editEntity('person','32058320250001234');
  await editEntity('network-wxid-zs001','wxid_zs001');
  await frame.locator('.graph-node [data-action="open-entity"][data-id="bank1"]').click();
  const detail=await frame.locator('#entity-basic-view').innerText();assert.match(detail,/000123456789012345/);assert.match(detail,/李四/);assert.match(detail,/建设银行/);
  await click('close-entity');
});

await test('EW03', '实体详情、权限待审批与明确的演示审批边界', async () => {
  await frame.locator('.graph-node [data-action="open-entity"][data-id="network-wxid-zs001"]').click();
  assert(await frame.locator('#entity-drawer').isVisible());
  assert.equal(await frame.locator('.recommendation').count(), 5);

  await frame.locator('[data-action="recommend-action"][data-tool="ip"]').click();
  assert(await frame.locator('#permission-dialog').isVisible());
  await frame.locator('#permission-approvers [data-action="request-permission"]').first().click();
  await frame.locator('#permission-reason-input').fill('核验合成账号登录设备，申请仅用于本地演示。');
  await frame.locator('#permission-submit').click();
  assert(!(await frame.locator('#permission-dialog').isVisible()));
  assert((await toastText()).includes('等待审批'));
  assert((await frame.locator('.recommendation').filter({ hasText: '账号使用设备IP' }).innerText()).includes('权限待审批'));

  await frame.locator('[data-action="recommend-action"][data-tool="ip"]').click();
  assert(await frame.locator('#permission-dialog').isVisible());
  assert((await frame.locator('#permission-title').innerText()).includes('待审批'));
  assert(await frame.locator('#permission-simulate').isVisible());
  assert(!(await frame.locator('#retrieval-dialog').isVisible()));
  await frame.locator('#permission-simulate').click();
  assert((await toastText()).includes('合成状态'));

  await frame.locator('[data-action="recommend-action"][data-tool="ip"]').click();
  assert(await frame.locator('#retrieval-dialog').isVisible());
  assert(await frame.locator('#retrieval-tools [data-tool="ip"]').isChecked());
  await frame.locator('#retrieval-submit').click();
  assert(!(await frame.locator('#retrieval-dialog').isVisible()));
});

await test('EW04', '卡片菜单、新建与已有实体子卡片分支', async () => {
  const initial = await frame.locator('.graph-node').count();
  await frame.locator('[data-action="card-menu"][data-id="network-wxid-zs001"]').click();
  await frame.locator('[data-action="card-add"][data-id="network-wxid-zs001"]').click();
  assert(await frame.locator('#child-dialog').isVisible());
  await frame.locator('#child-account').fill('演示新增账号');
  await frame.locator('#child-platform').fill('微信');
  await frame.locator('#child-dialog [data-action="save-child"]').click();
  assert(await frame.locator('#retrieval-dialog').isVisible());
  await frame.locator('#retrieval-dialog [data-action="close-dialog"]').first().click();
  assert.equal(await frame.locator('.graph-node').count(), initial + 1);

  await frame.locator('[data-action="card-menu"][data-id="network-wxid-zs001"]').click();
  await frame.locator('[data-action="card-add"][data-id="network-wxid-zs001"]').click();
  await frame.locator('#child-type').selectOption('人');
  await frame.locator('input[name="child-new"][value="no"]').check();
  await frame.locator('#child-lookup').fill('唐利岩');
  await frame.locator('#child-results [data-action="select-existing"]').first().click();
  await frame.locator('#child-dialog [data-action="save-child"]').click();
  assert(await frame.locator('#retrieval-dialog').isVisible());
  await frame.locator('#retrieval-dialog [data-action="close-dialog"]').first().click();
});

await test('EW05', '导图图层、视图、缩放、刷新与全屏语义独立', async () => {
  assert.equal(await frame.locator('#map-panel').getAttribute('data-scale'), '1');
  assert.equal((await frame.locator('.zoom-percent').innerText()).trim(), '100%');

  await page.waitForTimeout(200);
  await click('graph-layer');
  assert(await frame.locator('#graph-layer-menu').isVisible());
  assert.equal(await frame.locator('#graph-layer-menu [data-action="collapse-all"]').count(), 0);
  const inferredBefore = await frame.locator('#graph-edges path.inferred').count();
  assert(inferredBefore > 0);
  await frame.locator('[data-action="toggle-graph-layer"][data-layer="inferred"]').click();
  await page.waitForTimeout(80);
  assert.equal(await frame.locator('#graph-edges path.inferred').count(), 0);
  assert((await frame.locator('.graph-node').count()) > 1, '隐藏关系层不应移除实体节点');
  await frame.locator('[data-action="toggle-graph-layer"][data-layer="inferred"]').click();
  await page.waitForTimeout(80);
  assert.equal(await frame.locator('#graph-edges path.inferred').count(), inferredBefore);

  await click('graph-view');
  await click('collapse-all');
  assert.equal(await frame.locator('.graph-node').count(), 1);
  assert(await frame.locator('.graph-node[data-node="network-wxid-zs001"]').isVisible());
  await click('graph-view');
  await click('expand-all');
  assert((await frame.locator('.graph-node').count()) > 1);

  await click('entity-list');
  assert(await frame.locator('#entity-list-panel').isVisible());
  await click('entity-list');
  await frame.locator('.graph-zoom-controls [data-action="fit-view"]').click();
  await page.waitForTimeout(80);
  assert((await toastText()).includes('完整视图'));
  const fittedScale = Number(await frame.locator('#map-panel').getAttribute('data-scale'));
  assert(fittedScale < 1);
  assert.equal((await frame.locator('.zoom-percent').innerText()).trim(), `${Math.round(fittedScale * 100)}%`);
  await frame.locator('.zoom-percent').click();
  await page.waitForTimeout(80);
  assert.equal(await frame.locator('#map-panel').getAttribute('data-scale'), '1');
  assert.equal((await frame.locator('.zoom-percent').innerText()).trim(), '100%');

  await click('graph-actions');
  assert(await frame.locator('#graph-actions-menu').isVisible());
  await click('refresh');
  assert((await toastText()).includes('未请求真实数据'));
  assert.equal(await frame.locator('#map-panel').getAttribute('data-scale'), '1');
  await click('fullscreen');
  assert(await frame.locator('#map-panel').evaluate(node => node.classList.contains('fullscreen')));
  assert.equal(await frame.locator('#map-panel').getAttribute('data-scale'), '1');
  await click('fullscreen');
});

await test('EW06', '创建任务的新实体与已有实体分支', async () => {
  await click('back-list');
  const before = await frame.locator('#task-rows tr').count();
  await click('new-task');
  await frame.locator('#create-name').fill('合成事件新实体任务');
  await frame.locator('#create-account').fill('wxid_test_20261001');
  await frame.locator('#create-dialog [data-action="create-task"]').click();
  assert.equal(await frame.locator('#task-rows tr').count(), before + 1);

  await click('new-task');
  await frame.locator('#create-name').fill('合成事件已有实体任务');
  await frame.locator('#create-entity-type').selectOption('银行卡');
  await frame.locator('#create-entity-expanded').waitFor({ state: 'visible' });
  await frame.locator('input[name="create-new"][value="no"]').check();
  await frame.locator('#create-lookup').fill('6217');
  await frame.locator('#create-results [data-action="select-existing"]').first().click();
  await frame.locator('#create-dialog [data-action="create-task"]').click();
  assert.equal(await frame.locator('#task-rows tr').count(), before + 2);
});

await test('EW08', '实体页签切换、笔记保存与基本信息返回', async () => {
  await openTask('Task2026090001'); await click('enter-graph');
  await frame.locator('.graph-node [data-action="open-entity"][data-id="network-wxid-zs001"]').click();
  await frame.locator('[data-entity-tab="suggestions"]').click();
  assert((await frame.locator('#entity-content').evaluate(el => el.scrollTop)) > 0);
  await frame.locator('[data-entity-tab="basic"]').click();
  assert.equal(await frame.locator('#entity-content').evaluate(el => el.scrollTop), 0);
  await frame.locator('[data-entity-tab="notes"]').click();
  assert(await frame.locator('#entity-notes-view').isVisible());
  await click('add-note'); await frame.locator('#note-input').fill('仅本地保存的合成线索笔记'); await click('save-note');
  assert((await frame.locator('#note-list').innerText()).includes('仅本地保存的合成线索笔记'));
  await frame.locator('[data-entity-tab="results"]').click();
  assert(await frame.locator('#entity-results-view').isVisible());
  await click('close-entity'); await click('back-list');
});

await test('EW07', '深色主题与窄屏无横向溢出', async () => {
  await page.locator('.header [data-action=theme]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.screenshot({ path: path.join(output, 'event-workflow-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('html').evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
  await page.screenshot({ path: path.join(output, 'event-workflow-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1288, height: 824 });
  await page.locator('.header [data-action=theme]').click();
  await page.screenshot({ path: path.join(output, 'event-workflow-light.png'), fullPage: true });
});

await fs.writeFile(path.join(output, 'event-workflow-results.json'), JSON.stringify({
  testedAt: new Date().toISOString(),
  summary: { passed: results.filter(item => item.status === 'PASS').length, failed: results.filter(item => item.status === 'FAIL').length },
  errors,
  results
}, null, 2));

await browser.close();
console.log(JSON.stringify({ errors, results }, null, 2));
if (errors.length || results.some(item => item.status === 'FAIL')) process.exitCode = 1;
