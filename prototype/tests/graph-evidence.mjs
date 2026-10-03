import fs from 'node:fs/promises';
import path from 'node:path';

let pw;
try { pw = await import('playwright'); }
catch { pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const out = path.resolve(import.meta.dirname, '../../docs/design-audit-2026-10-02/evidence/prompt-04');
await fs.mkdir(out, {recursive: true});
const browser = await pw.chromium.launch({headless: true, channel: process.env.PW_CHANNEL || 'chrome'});
const context = await browser.newContext({
  viewport: {width: 1363, height: 936},
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
  acceptDownloads: true,
});
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
const captures = [];
page.on('pageerror', error => errors.push(error.message));

async function setTheme(theme) {
  const current = await page.locator('html').getAttribute('data-theme') || 'light';
  if (current !== theme) {
    await page.locator('[data-action="theme"]').click();
    await page.waitForTimeout(120);
  }
}
async function shot(name, details) {
  await page.waitForTimeout(120);
  const absolutePath = path.join(out, name);
  await page.screenshot({path: absolutePath});
  captures.push({file: name, absolutePath, viewport: '1363×936', browserZoom: '100%', ...details});
}
async function openCaseGraph() {
  await page.goto(`${base}/?prompt04=case#/PG12`);
  await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
  await page.locator('[data-action="case-stage"][data-step="3"]').click();
  await page.locator('[data-graph="case-detail-CASE-0817"] .entity-node').first().waitFor();
  await page.waitForTimeout(160);
}
async function caseMetrics(mode) {
  const graph = page.locator('[data-graph="case-detail-CASE-0817"]');
  return graph.evaluate((node, requestedMode) => {
    const stage = node.querySelector('.entity-stage');
    const card = node.querySelector('.entity-node');
    const primary = node.querySelector('.clue-primary,.clue-account-value,.clue-identifier');
    const canvas = node.closest('.cd-graph-canvas');
    const label = canvas?.querySelector('[data-graph-zoom-label]');
    return {
      module: 'PG13', mode: requestedMode, theme: document.documentElement.dataset.theme || 'light',
      caseId: 'CASE-0817', scale: Number(node.dataset.scale), transform: getComputedStyle(stage).transform,
      zoomLabel: label?.textContent.trim(), cardWidth: getComputedStyle(card).width,
      primaryFontSize: primary ? getComputedStyle(primary).fontSize : null,
      canvasBackgroundColor: getComputedStyle(canvas).backgroundColor,
      canvasBackgroundImage: getComputedStyle(canvas).backgroundImage,
      nodeCount: node.querySelectorAll('.entity-node').length,
    };
  }, mode);
}
async function openEventGraph() {
  await page.goto(`${base}/?prompt04=event#/PG14`);
  const host = page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  await host.locator('#task-rows tr').filter({hasText: 'Task2026090001'}).locator('[data-action="task-detail"]').click();
  await host.locator('[data-action="enter-graph"]').click();
  await host.locator('[data-node="network-wxid-zs001"]').waitFor();
  await page.waitForTimeout(160);
  return host;
}
async function eventMetrics(host, mode) {
  return host.locator('#map-panel').evaluate((panel, requestedMode) => {
    const root = panel.getRootNode();
    const stage = root.getElementById('graph-stage');
    const card = root.querySelector('.graph-node');
    const primary = root.querySelector('.clue-primary,.clue-account-value,.clue-identifier');
    const viewport = root.getElementById('graph-viewport');
    const label = root.querySelector('.zoom-percent');
    const rootCard = root.querySelector('[data-node="network-wxid-zs001"]');
    return {
      module: 'PG14', mode: requestedMode, theme: document.documentElement.dataset.theme || 'light',
      taskId: 'event-task-2026090001', taskName: 'Task2026090001', rootEntityId: 'network-wxid-zs001',
      rootCardType: rootCard?.dataset.cardType, rootIconClass: rootCard?.querySelector('.node-type-icon')?.className,
      scale: Number(panel.dataset.scale), transform: getComputedStyle(stage).transform,
      zoomLabel: label?.textContent.trim(), cardWidth: getComputedStyle(card).width,
      primaryFontSize: primary ? getComputedStyle(primary).fontSize : null,
      canvasBackgroundColor: getComputedStyle(viewport).backgroundColor,
      canvasBackgroundImage: getComputedStyle(viewport).backgroundImage,
      nodeCount: root.querySelectorAll('.graph-node').length,
      visibleRelationCount: root.querySelectorAll('#graph-edges path').length,
    };
  }, mode);
}

await openCaseGraph();
await setTheme('light');
let metrics = await caseMetrics('default-reading-100');
await shot('R09-R11-PG13-light-100.png', metrics);
await page.locator('.cd-graph-view-controls [data-action="node-fit"]').click();
await page.waitForTimeout(120);
metrics = await caseMetrics('explicit-fit-overview');
await shot('R09-R11-PG13-light-fit.png', metrics);
await page.locator('.cd-graph-view-controls [data-action="node-reset"]').click();
await setTheme('dark');
metrics = await caseMetrics('default-reading-100');
await shot('R09-R11-PG13-dark-100.png', metrics);
await page.locator('.cd-graph-view-controls [data-action="node-fit"]').click();
await page.waitForTimeout(120);
metrics = await caseMetrics('explicit-fit-overview');
await shot('R09-R11-PG13-dark-fit.png', metrics);

const host = await openEventGraph();
await setTheme('light');
metrics = await eventMetrics(host, 'default-reading-100');
await shot('R09-R11-R12-R21-PG14-light-100.png', metrics);
await host.locator('.graph-zoom-controls [data-action="fit-view"]').click();
await page.waitForTimeout(120);
metrics = await eventMetrics(host, 'explicit-fit-overview');
await shot('R09-R11-PG14-light-fit.png', metrics);
await host.locator('.zoom-percent').click();
await host.locator('[data-action="graph-layer"]').click();
await shot('R09-PG14-layer-menu.png', {...await eventMetrics(host, 'layer-menu'), menu: 'only relation/source visibility controls'});
await host.locator('[data-action="graph-view"]').click();
await shot('R09-PG14-view-menu.png', {...await eventMetrics(host, 'view-menu'), menu: 'collapse/expand/reset/fit'});
await host.locator('[data-action="graph-actions"]').click();
await shot('R09-PG14-actions-menu.png', {...await eventMetrics(host, 'actions-menu'), menu: 'refresh/export'});
await host.locator('[data-action="graph-actions"]').click();
await setTheme('dark');
metrics = await eventMetrics(host, 'default-reading-100-after-theme-switch');
await shot('R09-R11-R12-R21-PG14-dark-100.png', metrics);
await host.locator('.graph-zoom-controls [data-action="fit-view"]').click();
await page.waitForTimeout(120);
metrics = await eventMetrics(host, 'explicit-fit-overview');
await shot('R09-R11-PG14-dark-fit.png', metrics);
await host.locator('.zoom-percent').click();

await host.locator('[data-action="card-menu"][data-id="network-wxid-zs001"]').click();
await host.locator('[data-action="card-edit"][data-id="network-wxid-zs001"]').click();
await host.locator('#child-account').fill('wxid_zs001_long_identifier_20261003');
await host.locator('#child-dialog [data-action="save-child"]').click();
await host.locator('[data-node="network-wxid-zs001"]').waitFor();
metrics = await eventMetrics(host, 'long-account-100');
await shot('R11-R12-R21-PG14-long-account-dark-100.png', {...metrics, account: 'wxid_zs001_long_identifier_20261003'});

const metadata = {
  generatedAt: new Date().toISOString(),
  base,
  viewport: {width: 1363, height: 936},
  deviceScaleFactor: 1,
  browserZoom: '100%',
  dataBoundary: '本地合成 fixture；未接入真实案件、任务、交易或调证服务',
  designBoundary: '最新 Figma revision 未验证；画布 token 复用当前已确认代码基准；约 12px 为本轮可读性建议，不是官方 token',
  captures,
  errors,
};
await fs.writeFile(path.join(out, 'metrics.json'), JSON.stringify(metadata, null, 2));
console.log(JSON.stringify({captured: captures.length, errors, out}, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
