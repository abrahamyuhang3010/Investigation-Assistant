import fs from 'node:fs/promises';
import path from 'node:path';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const out = path.resolve(import.meta.dirname, '../../docs/design-audit-2026-10-02/evidence/prompt-03');
await fs.mkdir(out, { recursive: true });
const browser = await pw.chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'chrome' });
const context = await browser.newContext({
  viewport: { width: 1363, height: 936 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
const captures = [];
let sequence = 0;
page.on('pageerror', error => errors.push(error.message));

const route = async id => {
  sequence += 1;
  await page.goto(`${base}/?foundationEvidence=${sequence}#/${id}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(180);
};
const setTheme = async theme => {
  const current = await page.locator('html').getAttribute('data-theme') || 'light';
  if (current !== theme) {
    await page.locator('[data-action="theme"]').click();
    await page.waitForTimeout(80);
  }
};
const capture = async (name, details = {}) => {
  await page.waitForTimeout(100);
  const file = path.join(out, name);
  await page.screenshot({ path: file });
  captures.push({
    file: name,
    absolutePath: file,
    route: new URL(page.url()).hash.replace('#/', ''),
    theme: await page.locator('html').getAttribute('data-theme') || 'light',
    viewport: `${page.viewportSize().width}×${page.viewportSize().height}`,
    deviceScaleFactor: 1,
    zoom: '100%',
    ...details,
  });
};

async function openCaseCreate(theme) {
  await route('PG12');
  await setTheme(theme);
  await page.locator('[data-action="case-create"]').click();
  await page.locator('#overlay .modal').waitFor();
}

async function openEventCreate(theme) {
  await route('PG14');
  await setTheme(theme);
  const host = page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  await host.locator('[data-action="new-task"]').click();
  await host.locator('#create-dialog').waitFor();
  await host.locator('#create-entity-type').selectOption('银行卡');
  await host.locator('#create-entity-expanded').waitFor({ state: 'visible' });
  return host;
}

async function openBankEdit(theme) {
  await route('PG14');
  await setTheme(theme);
  const host = page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  const row = host.locator('#task-rows tr').filter({ hasText: 'Task2026090001' });
  await row.locator('[data-action="task-detail"]').click();
  await host.locator('[data-action="enter-graph"]').click();
  await host.locator('[data-node="bank1"]').waitFor();
  await host.locator('[data-action="card-menu"][data-id="bank1"]').click();
  await host.locator('[data-action="card-edit"][data-id="bank1"]').click();
  await host.locator('#child-dialog').waitFor();
  return host;
}

await openCaseCreate('light');
await capture('R13-PG12-case-create-light.png', { view: '新增案件', data: '本地合成案件表单；7 个字段' });
await page.locator('[data-action="close"]').last().click();
await setTheme('dark');
await page.locator('[data-action="case-create"]').click();
await capture('R13-PG12-case-create-dark.png', { view: '新增案件', data: '本地合成案件表单；7 个字段' });

let host = await openEventCreate('light');
await capture('R13-PG14-task-create-light.png', { view: '新建研判任务', entityType: '银行卡', data: '本地合成 fixture' });
await host.locator('#create-dialog [data-action="close-dialog"]').last().click();
await setTheme('dark');
await host.locator('[data-action="new-task"]').click();
await host.locator('#create-entity-type').selectOption('银行卡');
await host.locator('#create-entity-expanded').waitFor({ state: 'visible' });
await capture('R13-PG14-task-create-dark.png', { view: '新建研判任务', entityType: '银行卡', data: '本地合成 fixture' });

host = await openBankEdit('light');
await capture('R13-PG14-entity-edit-light.png', { view: '实体编辑短表单', taskId: 'Task2026090001', entityId: 'bank1', entityType: '银行卡' });
await capture('R23-short-form.png', { view: '实体编辑短表单', taskId: 'Task2026090001', entityId: 'bank1', decisionToken: '--dialog-short-size: 560px（本轮实现决策，非 Figma 官方值）' });
await host.locator('#child-account').fill('****');
await host.locator('#child-dialog [data-action="save-child"]').click();
await capture('R13-inline-error.png', { view: '实体编辑字段级错误', taskId: 'Task2026090001', entityId: 'bank1', validation: '银行卡号应为 8–30 位数字' });
await host.locator('#child-dialog [data-action="close-dialog"]').last().click();
await setTheme('dark');
await host.locator('[data-action="card-menu"][data-id="bank1"]').click();
await host.locator('[data-action="card-edit"][data-id="bank1"]').click();
await capture('R13-PG14-entity-edit-dark.png', { view: '实体编辑短表单', taskId: 'Task2026090001', entityId: 'bank1', entityType: '银行卡' });

await page.setViewportSize({ width: 390, height: 700 });
await route('PG12');
await setTheme('light');
await page.locator('[data-action="case-create"]').click();
await page.locator('#overlay .modal').waitFor();
await capture('R23-small-viewport-footer.png', { view: '新增案件长表单小视口', data: '标题与操作区保持可见；内容区内部滚动' });
await page.setViewportSize({ width: 1363, height: 936 });

const metadata = {
  generatedAt: new Date().toISOString(),
  base,
  defaultViewport: { width: 1363, height: 936 },
  smallViewport: { width: 390, height: 700 },
  deviceScaleFactor: 1,
  zoom: '100%',
  syntheticData: true,
  realApi: false,
  latestFigmaRevisionVerified: false,
  figmaBoundary: '当前会话未读取到可验证 revision 的最新 Figma；弹窗尺寸为本轮实现决策。',
  errors,
  captures,
};
await fs.writeFile(path.join(out, 'screenshot-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
console.log(JSON.stringify(metadata, null, 2));
