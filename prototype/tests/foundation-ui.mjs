import assert from 'node:assert/strict';
import path from 'node:path';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const browser = await pw.chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport: { width: 1363, height: 936 }, colorScheme: 'light' });
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const results = [];
async function test(id, name, fn) {
  const before = errors.length;
  try {
    await fn();
    assert.equal(errors.length, before, '浏览器运行时出现错误');
    results.push({ id, name, status: 'PASS' });
    console.log(`${id}: PASS - ${name}`);
  } catch (error) {
    results.push({ id, name, status: 'FAIL', error: error.message });
    console.error(`${id}: FAIL - ${name}\n${error.stack}`);
    throw error;
  }
}

let navigationSequence = 0;
const go = async id => {
  navigationSequence += 1;
  await page.goto(`${base}/?foundation=${navigationSequence}#/${id}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(120);
};
const rootTokenColor = async token => page.evaluate(name => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}, token);
const rootTokenBackground = async token => page.evaluate(name => {
  const probe = document.createElement('span');
  probe.style.backgroundColor = `var(${name})`;
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}, token);
const withinViewport = async locator => {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert(box, '元素没有可测量边界');
  assert(box.x >= 0 && box.y >= 0, `元素越过视口左/上边界：${JSON.stringify(box)}`);
  assert(box.x + box.width <= viewport.width + 1, `元素越过视口右边界：${JSON.stringify(box)}`);
  assert(box.y + box.height <= viewport.height + 1, `元素越过视口下边界：${JSON.stringify(box)}`);
};

await test('FND-R13-CASE', 'PG12 新增案件共享字段语义、错误关联与长表单规格', async () => {
  await go('PG12');
  await page.locator('[data-action="case-create"]').click();
  const modal = page.locator('#overlay .modal');
  const form = page.locator('#modal-form');
  await modal.waitFor();
  assert.equal(await form.locator('input,select,textarea').count(), 7);
  assert.equal(await modal.evaluate(node => node.classList.contains('short-form')), false, '七字段案件表单不应套用短表单规格');
  for (const name of ['name', 'number', 'owner', 'caseType', 'clueCategory', 'caseStatus', 'analysisStatus']) {
    const control = form.locator(`[name="${name}"]`);
    const id = await control.getAttribute('id');
    assert(id, `${name} 缺少 id`);
    assert.equal(await form.locator(`label[for="${id}"]`).count(), 1, `${name} 缺少关联 label`);
    assert((await control.getAttribute('aria-describedby') || '').includes(`${id}-error`), `${name} 缺少错误关联`);
  }
  for (const name of ['name', 'number', 'owner']) {
    const control = form.locator(`[name="${name}"]`);
    assert.equal(await control.getAttribute('aria-required'), 'true');
  }
  await form.locator('[name="name"]').fill('');
  await form.locator('[name="number"]').fill('');
  await form.locator('[name="owner"]').fill('');
  await form.locator('button[type="submit"]').click();
  const first = form.locator('[name="name"]');
  assert.equal(await first.getAttribute('aria-invalid'), 'true');
  assert.match(await form.locator('#field-name-error').innerText(), /请填写案件名称/);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('name')), 'name');
  await first.fill('合成字段规范验收案');
  assert.equal(await first.getAttribute('aria-invalid'), null);
  assert.equal(await form.locator('#field-name-error').innerText(), '');
  await page.locator('[data-action="close"]').last().click();
});

await test('FND-R13-EVENT-CREATE', 'PG14 新建任务按实体类型切换标签、占位与必填语义', async () => {
  await go('PG14');
  const frame = page.locator('event-workflow');
  await frame.locator('#task-rows tr').first().waitFor();
  await frame.locator('[data-action="new-task"]').click();
  const dialog = frame.locator('#create-dialog');
  await dialog.waitFor();
  const quickType = frame.locator('#create-entity-type');
  const quickValue = frame.locator('#create-account');
  assert.equal(await quickValue.getAttribute('placeholder'), '请输入网络账号标识');
  assert.match(await frame.locator('#create-account-quick-label').innerText(), /网络账号/);
  await quickType.selectOption('银行卡');
  const fullType = frame.locator('#create-entity-type-full');
  await fullType.waitFor({ state: 'visible' });
  assert.equal(await fullType.inputValue(), '银行卡');
  assert.equal(await frame.locator('#create-account-full').getAttribute('placeholder'), '请输入银行卡号');
  assert.match(await frame.locator('#create-account-label').innerText(), /银行卡号/);

  const platform = frame.locator('#create-platform');
  await fullType.selectOption('网络账号');
  assert.equal(await platform.getAttribute('required'), '');
  assert.equal(await platform.getAttribute('aria-required'), 'true');
  await fullType.selectOption('银行卡');
  assert.equal(await platform.getAttribute('required'), null);
  assert.equal(await platform.getAttribute('aria-required'), 'false');
  assert.equal(await frame.locator('#create-account-full').getAttribute('placeholder'), '请输入银行卡号');
  await fullType.selectOption('人');
  assert.equal(await frame.locator('#create-account-full').getAttribute('placeholder'), '请输入身份证号');
  await frame.locator('#create-dialog [data-action="close-dialog"]').last().click();
});

await test('FND-R13-R23-EDIT', 'PG14 实体编辑使用短表单、字段级格式错误与焦点恢复', async () => {
  const frame = page.locator('event-workflow');
  const row = frame.locator('#task-rows tr').filter({ hasText: 'Task2026090001' });
  await row.locator('[data-action="task-detail"]').click();
  await frame.locator('[data-action="enter-graph"]').click();
  await frame.locator('[data-node="bank1"]').waitFor();
  await frame.locator('[data-action="card-menu"][data-id="bank1"]').click();
  await frame.locator('[data-action="card-edit"][data-id="bank1"]').click();
  const dialog = frame.locator('#child-dialog');
  assert(await dialog.isVisible());
  assert.equal(await dialog.evaluate(node => node.classList.contains('dialog-short-form')), true);
  const metrics = await dialog.evaluate(node => {
    const style = getComputedStyle(node);
    return { height: node.getBoundingClientRect().height, cssHeight: style.height, maxHeight: style.maxHeight };
  });
  assert(metrics.height < 744, `短表单不应保留约 744px 固定高度：${JSON.stringify(metrics)}`);
  assert.notEqual(metrics.cssHeight, '744px');
  assert.equal(await frame.locator('#child-account').getAttribute('placeholder'), '请输入银行卡号');
  assert.match(await frame.locator('#child-account-label').innerText(), /银行卡号/);
  await frame.locator('#child-account').fill('****');
  await frame.locator('#child-dialog [data-action="save-child"]').click();
  const account = frame.locator('#child-account');
  assert.equal(await account.getAttribute('aria-invalid'), 'true');
  assert.match(await frame.locator('#child-account-error').innerText(), /8–30 位数字/);
  assert.equal(await frame.evaluate(node => node.shadowRoot?.activeElement?.id), 'child-account');
  await account.fill('000123456789012345');
  assert.equal(await account.getAttribute('aria-invalid'), null);
  assert.equal(await frame.locator('#child-account-error').innerText(), '');
  await frame.locator('#child-dialog [data-action="close-dialog"]').last().click();
});

await test('FND-R20', '全局与 PG14 在浅深主题复用主按钮、输入与焦点语义 token', async () => {
  await go('PG12');
  const lightPrimary = await rootTokenBackground('--ui-primary');
  const lightControl = await rootTokenBackground('--ui-control-bg');
  assert.equal(await page.locator('[data-action="case-create"]').evaluate(node => getComputedStyle(node).backgroundColor), lightPrimary);
  await page.locator('[data-action="case-create"]').click();
  assert.equal(await page.locator('#field-name').evaluate(node => getComputedStyle(node).backgroundColor), lightControl);
  await page.locator('[data-action="close"]').last().click();

  await go('PG14');
  const frame = page.locator('event-workflow');
  await frame.locator('#task-rows tr').first().waitFor();
  assert.equal(await frame.locator('[data-action="new-task"]').evaluate(node => getComputedStyle(node).backgroundColor), lightPrimary);
  await frame.locator('[data-action="new-task"]').click();
  assert.equal(await frame.locator('#create-name').evaluate(node => getComputedStyle(node).backgroundColor), lightControl);
  await frame.locator('#create-dialog [data-action="close-dialog"]').last().click();

  await page.locator('[data-action="theme"]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await frame.getAttribute('data-theme'), 'dark');
  const darkPrimary = await rootTokenBackground('--ui-primary');
  const darkControl = await rootTokenBackground('--ui-control-bg');
  assert.notEqual(darkPrimary, lightPrimary);
  assert.notEqual(darkControl, lightControl);
  assert.equal(await frame.locator('[data-action="new-task"]').evaluate(node => getComputedStyle(node).backgroundColor), darkPrimary);
  await frame.locator('[data-action="new-task"]').click();
  assert.equal(await frame.locator('#create-name').evaluate(node => getComputedStyle(node).backgroundColor), darkControl);
  const focusRing = await rootTokenColor('--ui-focus-ring');
  await frame.locator('#create-name').focus();
  assert(focusRing && focusRing !== 'rgba(0, 0, 0, 0)');
  await frame.locator('#create-dialog [data-action="close-dialog"]').last().click();
});

await test('FND-R23-RESPONSIVE', '小视口中长表单与短表单不越界且操作区可见', async () => {
  await page.setViewportSize({ width: 390, height: 700 });
  await go('PG12');
  await page.locator('[data-action="case-create"]').click();
  await withinViewport(page.locator('#overlay .modal'));
  await withinViewport(page.locator('#overlay .modal-header'));
  await withinViewport(page.locator('#overlay .form-actions'));
  const modalBody = page.locator('#overlay .modal-body');
  assert((await modalBody.evaluate(node => node.scrollHeight)) >= (await modalBody.evaluate(node => node.clientHeight)));
  await page.locator('[data-action="close"]').last().click();

  await go('PG14');
  const frame = page.locator('event-workflow');
  await frame.locator('#task-rows tr').first().waitFor();
  const row = frame.locator('#task-rows tr').filter({ hasText: 'Task2026090001' });
  await row.locator('[data-action="task-detail"]').click();
  await frame.locator('[data-action="enter-graph"]').click();
  await frame.locator('[data-action="card-menu"][data-id="bank1"]').click();
  await frame.locator('[data-action="card-edit"][data-id="bank1"]').click();
  await withinViewport(frame.locator('#child-dialog'));
  await withinViewport(frame.locator('#child-dialog .dialog-header'));
  await withinViewport(frame.locator('#child-dialog .dialog-footer'));
  await frame.locator('#child-dialog [data-action="close-dialog"]').last().click();
  await page.setViewportSize({ width: 1363, height: 936 });
});

await browser.close();
assert.deepEqual(errors, []);
assert(results.every(result => result.status === 'PASS'));
console.log('foundation-ui: ok');
