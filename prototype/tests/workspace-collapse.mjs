import assert from 'node:assert/strict';
import path from 'node:path';

let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
}

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4186';
const browser = await pw.chromium.launch({headless: true, channel: process.env.PW_CHANNEL || 'chrome'});
const results = [];
const runtimeErrors = [];
let context;
let page;

const workspaceCard = () => page.locator('.super-search-page .ss-workspace').filter({visible: true}).first();
const workspaceCollapse = () => page.getByRole('button', {name: '收起研判空间'}).filter({visible: true}).first();
const workspaceLauncher = () => page.locator('[data-action="super-pane-expand"][data-pane="right"], [data-action="super-workspace-expand"]').filter({visible: true}).first();
const center = () => page.locator('.super-search-page .ss-center');
const prompt = () => page.locator('#super-search-prompt');

async function reset() {
  await page.goto(base + '/#/PG05');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.locator('.super-search-page').waitFor();
  await workspaceCard().waitFor();
}

async function collapseWorkspace() {
  await workspaceCollapse().click();
  await workspaceLauncher().waitFor();
  await assertEventually(async () => !(await workspaceCard().isVisible().catch(() => false)), '研判空间卡片未完成收起');
}

async function expandWorkspace() {
  await workspaceLauncher().click();
  await workspaceCard().waitFor();
  await workspaceCollapse().waitFor();
}

async function assertEventually(predicate, message, timeout = 2500) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await page.waitForTimeout(50);
  }
  assert.fail(message);
}

async function workspaceProgress() {
  const launcher = workspaceLauncher();
  const rail = launcher.locator('xpath=..');
  const semantic = rail.locator('[role="progressbar"]').filter({visible: true});
  if (await semantic.count()) return semantic.first();
  return page.locator('[data-workspace-progress],.ss-workspace-progress,.ss-mini-progress').filter({visible: true}).first();
}

async function visibleProgressCount() {
  const launcher = workspaceLauncher();
  const rail = launcher.locator('xpath=..');
  const semantic = rail.locator('[role="progressbar"]').filter({visible: true});
  if (await semantic.count()) return semantic.count();
  return page.locator('[data-workspace-progress],.ss-workspace-progress,.ss-mini-progress').filter({visible: true}).count();
}

async function progressRatio(locator) {
  return locator.evaluate(element => {
    const now = Number(element.getAttribute('aria-valuenow'));
    const min = Number(element.getAttribute('aria-valuemin') || 0);
    const max = Number(element.getAttribute('aria-valuemax') || 100);
    if (Number.isFinite(now) && Number.isFinite(max) && max > min) return (now - min) / (max - min);
    const fill = element.querySelector('[data-progress-fill],i,span');
    const width = Number.parseFloat(fill?.style.width || '');
    return Number.isFinite(width) ? width / 100 : null;
  });
}

async function progressDescriptor() {
  const launcher = workspaceLauncher();
  await launcher.hover();
  await page.waitForTimeout(120);
  return page.evaluate(() => {
    const trigger = [...document.querySelectorAll('[data-action="super-pane-expand"][data-pane="right"], [data-action="super-workspace-expand"]')].find(element => element.getClientRects().length);
    const rail = trigger?.parentElement;
    const tooltip = [...document.querySelectorAll('[role="tooltip"]')].find(element => element.getClientRects().length)?.textContent || '';
    return [trigger?.getAttribute('aria-label'), trigger?.getAttribute('title'), rail?.getAttribute('aria-label'), rail?.getAttribute('title'), tooltip]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  });
}

async function setTaskState({queryStatus, subtaskStatuses, totalKnown = true, executionStarted}) {
  await page.evaluate(async ({queryStatus, subtaskStatuses, totalKnown, executionStarted}) => {
    const model = await import('/src/super-search-model.js');
    const stateModule = await import('/src/state.js');
    const search = model.ensureSuperSearchState();
    stateModule.state.network = false;
    const query = search.query;
    const statuses = [...subtaskStatuses];

    if (totalKnown) {
      if (!query.subtasks?.length) {
        query.subtasks = statuses.map((status, index) => ({
          id: `WORKSPACE-TEST-${index + 1}`,
          index: String(index + 1).padStart(2, '0'),
          name: `回归测试子任务 ${index + 1}`,
          status,
        }));
      }
      query.subtasks = query.subtasks.slice(0, statuses.length);
      statuses.forEach((status, index) => {
        if (query.subtasks[index]) query.subtasks[index].status = status;
      });
      query.completedLeafTasks = statuses.filter(status => ['done', 'reused'].includes(status)).length;
      query.totalLeafTasks = statuses.length;
      query.totalTaskCount = statuses.length;
    } else {
      query.subtasks = [];
      delete query.completedLeafTasks;
      delete query.totalLeafTasks;
      delete query.totalTaskCount;
    }

    query.status = queryStatus;
    const executionEvents = new Set(['tool_started', 'tool_finished', 'tool_waiting_approval', 'tool_canceled']);
    if (executionStarted === false) query.events = (query.events || []).filter(event => !executionEvents.has(event.type));
    if (executionStarted === true && !(query.events || []).some(event => executionEvents.has(event.type))) {
      query.events = [...(query.events || []), {type: 'tool_started', toolCallId: 'WORKSPACE-TEST-TOOL', status: 'running'}];
    }
    if (queryStatus === 'done') query.progressCompletedAt = Date.now();
    else delete query.progressCompletedAt;
    const currentSession = stateModule.state.sessions.find(session => session.id === stateModule.state.sessionId);
    if (currentSession) {
      currentSession.state = ({running: 'RUNNING', waiting_approval: 'PAUSED', paused: 'PAUSED', suspended: 'PAUSED', done: 'DONE', failed: 'FAILED', canceled: 'DONE'})[queryStatus] || queryStatus.toUpperCase();
      currentSession.stage = ({running: 'Execution', waiting_approval: 'Permission', paused: 'Paused', suspended: 'Suspended', done: 'Completed', failed: 'Failed', canceled: 'Terminated'})[queryStatus] || currentSession.stage;
    }
    stateModule.save();
  }, {queryStatus, subtaskStatuses, totalKnown, executionStarted});
  await page.reload();
  await page.locator('.super-search-page').waitFor();
}

async function assertNoHorizontalOverflow(width) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `viewport ${width}px 出现横向滚动`);
}

async function assertPromptIsReachable(width) {
  const box = await prompt().boundingBox();
  assert(box && box.width >= 180 && box.height > 0, `viewport ${width}px 主输入框不可见或过窄`);
  const hit = await page.evaluate(({x, y}) => {
    const element = document.elementFromPoint(x, y);
    return element?.id === 'super-search-prompt' || !!element?.closest?.('#super-search-composer');
  }, {x: box.x + box.width / 2, y: box.y + box.height / 2});
  assert(hit, `viewport ${width}px 主输入框中心被研判空间遮挡`);
  if (await prompt().isEnabled()) {
    await prompt().fill(`resize-${width}`);
    assert.equal(await prompt().inputValue(), `resize-${width}`);
  }
}

async function test(name, fn, viewport = {width: 1600, height: 1000}) {
  context = await browser.newContext({viewport});
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => runtimeErrors.push({name, error: error.message}));
  const before = runtimeErrors.length;
  try {
    await reset();
    await fn();
    assert.equal(runtimeErrors.length, before, '浏览器运行时出现异常');
    results.push({name, status: 'PASS'});
  } catch (error) {
    results.push({name, status: 'FAIL', error: error.stack});
  } finally {
    console.log(results.at(-1));
    await context.close();
  }
}

await test('默认悬浮卡片、展开收起与浏览器会话持久化', async () => {
  const card = workspaceCard();
  const cardBox = await card.boundingBox();
  const workbenchBox = await page.locator('.super-search-page').boundingBox();
  const centerExpanded = await center().boundingBox();
  assert(cardBox && workbenchBox && centerExpanded);
  assert(cardBox.width >= 520 && cardBox.width <= 600, `展开态宽度应为 520–600px，实际 ${cardBox.width}px`);
  const rightGap = workbenchBox.x + workbenchBox.width - (cardBox.x + cardBox.width);
  const topGap = cardBox.y - workbenchBox.y;
  const bottomGap = workbenchBox.y + workbenchBox.height - (cardBox.y + cardBox.height);
  assert(rightGap >= 16 && rightGap <= 28, `展开态应与工作区右侧保留约 20px 间距，实际 ${rightGap}px`);
  assert(topGap >= 16 && topGap <= 28, `展开态应与工作区顶部保留约 20px 间距，实际 ${topGap}px`);
  assert(bottomGap >= 16 && bottomGap <= 28, `展开态应与工作区底部保留约 20px 间距，实际 ${bottomGap}px`);
  const visual = await card.evaluate(element => {
    const style = getComputedStyle(element);
    return {radius: Number.parseFloat(style.borderRadius), shadow: style.boxShadow, position: style.position};
  });
  assert(visual.radius >= 14, `悬浮卡片圆角不足：${visual.radius}px`);
  assert.notEqual(visual.shadow, 'none', '悬浮卡片缺少阴影');
  assert.notEqual(visual.position, 'fixed', '研判空间不应以覆盖聊天内容的 fixed panel 实现');

  await collapseWorkspace();
  const launcherBox = await workspaceLauncher().boundingBox();
  const centerCollapsed = await center().boundingBox();
  assert(launcherBox && centerCollapsed);
  assert(Math.abs(launcherBox.width - 48) <= 2 && Math.abs(launcherBox.height - 48) <= 2, `收起入口应为 48×48px，实际 ${launcherBox.width}×${launcherBox.height}`);
  assert(centerCollapsed.width > centerExpanded.width + 350, '收起后主工作区没有明显扩展');

  await page.reload();
  await page.locator('.super-search-page').waitFor();
  await workspaceLauncher().waitFor();
  assert.equal(await workspaceCard().isVisible().catch(() => false), false, '刷新后未保持收起状态');

  const anotherSession = page.locator('[data-action="super-session-open"]:not([aria-current="page"])').filter({visible: true}).first();
  if (await anotherSession.count()) {
    await anotherSession.click();
    await workspaceLauncher().waitFor();
    assert.equal(await workspaceCard().isVisible().catch(() => false), false, '切换对话后不应强制展开研判空间');
  }

  await expandWorkspace();
  assert(await workspaceCard().isVisible(), '点击 Workspace Icon 后未重新展开');
});

await test('收起态任务 Progress 与展开态共用进度并覆盖暂停、完成、失败和取消', async () => {
  await setTaskState({queryStatus: 'canceled', subtaskStatuses: ['canceled', 'canceled', 'canceled', 'canceled', 'canceled']});
  if (await workspaceCard().isVisible()) await collapseWorkspace();
  await page.waitForTimeout(750);
  assert.equal(await visibleProgressCount(), 0, '无 Active Task / CANCELED 时不应显示 Progress');

  await setTaskState({queryStatus: 'running', subtaskStatuses: ['done', 'done', 'waiting_approval', 'pending', 'pending']});
  await workspaceLauncher().waitFor();
  await expandWorkspace();
  const expandedProgress = await page.evaluate(async () => (await import('/src/super-search-model.js')).getSuperSearchTaskProgress());
  assert.equal(expandedProgress.completed, 2, '展开态应保留 2 个已完成子任务');
  assert.equal(expandedProgress.total, 5, '展开态应保留 5 个子任务总数');
  const taskBeforeCollapse = await page.evaluate(async () => {
    const query = (await import('/src/super-search-model.js')).ensureSuperSearchState().query;
    return {status: query.status, completed: query.subtasks.filter(task => ['done', 'reused'].includes(task.status)).length, total: query.subtasks.length};
  });
  await collapseWorkspace();
  const taskAfterCollapse = await page.evaluate(async () => {
    const query = (await import('/src/super-search-model.js')).ensureSuperSearchState().query;
    return {status: query.status, completed: query.subtasks.filter(task => ['done', 'reused'].includes(task.status)).length, total: query.subtasks.length};
  });
  assert.equal(taskAfterCollapse.completed, taskBeforeCollapse.completed, 'Collapse 不得清空已完成子任务状态');
  assert.equal(taskAfterCollapse.total, taskBeforeCollapse.total, 'Collapse 不得清空任务拆解状态');
  assert.notEqual(taskAfterCollapse.status, 'canceled', 'Collapse 不得将任务标记为取消');
  const runningProgress = await workspaceProgress();
  await runningProgress.waitFor();
  assert(Math.abs((await progressRatio(runningProgress)) - 0.4) < 0.02, '收起态 Progress 应为 40%');
  const descriptor = await progressDescriptor();
  assert.match(descriptor, /任务执行中|任务等待审批|执行中|等待审批/, 'Workspace Tooltip 应说明任务状态');
  assert.match(descriptor.replace(/\s/g, ''), /2\/5/, 'Workspace Tooltip 应显示 2 / 5');
  assert.match(descriptor, /40%/, 'Workspace Tooltip 应显示 40%');

  await setTaskState({queryStatus: 'waiting_approval', subtaskStatuses: ['done', 'done', 'waiting_approval', 'pending', 'pending']});
  const pausedProgress = await workspaceProgress();
  await pausedProgress.waitFor();
  assert(Math.abs((await progressRatio(pausedProgress)) - 0.4) < 0.02, 'WAITING_APPROVAL 应保留当前 40% Progress');

  await setTaskState({queryStatus: 'running', subtaskStatuses: ['done', 'done', 'done', 'running', 'pending']});
  const resumedProgress = await workspaceProgress();
  await resumedProgress.waitFor();
  assert(Math.abs((await progressRatio(resumedProgress)) - 0.6) < 0.02, 'Resume 后 Progress 应继续增长到 60%');

  await setTaskState({queryStatus: 'done', subtaskStatuses: ['done', 'done', 'done', 'done', 'done']});
  const completedProgress = await workspaceProgress();
  await completedProgress.waitFor();
  assert(Math.abs((await progressRatio(completedProgress)) - 1) < 0.001, 'DONE 应先更新到 100%');
  await assertEventually(async () => (await visibleProgressCount()) === 0, 'DONE 的 100% Progress 未在短暂停留后隐藏', 2200);

  await setTaskState({queryStatus: 'failed', subtaskStatuses: ['done', 'done', 'failed', 'pending', 'pending']});
  const failedProgress = await workspaceProgress();
  await failedProgress.waitFor();
  const failedRatio = await progressRatio(failedProgress);
  assert(failedRatio === null || failedRatio < 1, 'FAILED 不得伪装成 100% 完成');
  const failedState = await failedProgress.evaluate(element => `${element.dataset.status || ''} ${element.className || ''} ${element.getAttribute('aria-label') || ''}`);
  assert.match(failedState, /fail|error|danger|失败/i, 'FAILED Progress 缺少错误状态语义');

  await setTaskState({queryStatus: 'canceled', subtaskStatuses: ['done', 'done', 'canceled', 'canceled', 'canceled']});
  await page.waitForTimeout(120);
  assert.equal(await visibleProgressCount(), 0, 'CANCELED 应隐藏 Progress');
});

await test('计划已生成但子任务未执行时隐藏 Progress，执行开始后显示', async () => {
  await collapseWorkspace();
  await setTaskState({queryStatus: 'awaiting_plan', subtaskStatuses: ['pending', 'pending', 'dependency_blocked'], executionStarted: false});
  assert.equal(await visibleProgressCount(), 0, '计划已生成但未执行子任务时不应显示 Progress');

  await setTaskState({queryStatus: 'running', subtaskStatuses: ['running', 'pending', 'dependency_blocked'], executionStarted: true});
  const progress = await workspaceProgress();
  await progress.waitFor();
  assert.equal(await visibleProgressCount(), 1, '首个子任务开始执行后应显示 Progress');
});

await test('任务尚未拆解时使用 indeterminate Progress 且不虚构百分比', async () => {
  await collapseWorkspace();
  await setTaskState({queryStatus: 'running', subtaskStatuses: [], totalKnown: false, executionStarted: true});
  const progress = await workspaceProgress();
  await progress.waitFor();
  assert.equal(await progress.getAttribute('aria-valuenow'), null, 'indeterminate Progress 不应提供虚构的 aria-valuenow');
  const state = await progress.evaluate(element => `${element.dataset.status || ''} ${element.className || ''}`);
  assert.match(state, /indeterminate|is-loading|loading/i, '未知总任务数时缺少 indeterminate 状态');
  assert.doesNotMatch(await progressDescriptor(), /\b\d+%/, '未知总任务数时 Tooltip 不应虚构百分比');
});

await test('Resize 时主工作区平滑让位且不遮挡输入框', async () => {
  for (const width of [1600, 1440, 1280, 1024]) {
    await page.setViewportSize({width, height: 900});
    await page.waitForTimeout(280);
    await assertNoHorizontalOverflow(width);
    await assertPromptIsReachable(width);
  }

  await page.setViewportSize({width: 1600, height: 900});
  await page.waitForTimeout(280);
  if (!(await workspaceCard().isVisible().catch(() => false))) await expandWorkspace();
  const expandedWidth = (await center().boundingBox()).width;
  await collapseWorkspace();
  const collapsedWidth = (await center().boundingBox()).width;
  assert(collapsedWidth > expandedWidth + 350, '桌面端收起后 Main Workspace 未自动扩展');
  await assertPromptIsReachable(1600);
  await expandWorkspace();
  await page.waitForTimeout(280);
  const restoredWidth = (await center().boundingBox()).width;
  assert(Math.abs(restoredWidth - expandedWidth) <= 4, `重新展开后 Main Workspace 宽度未平滑恢复：${expandedWidth} → ${restoredWidth}`);
});

await browser.close();
console.log(`${results.filter(result => result.status === 'PASS').length}/${results.length}; runtime errors: ${runtimeErrors.length}`);
if (results.some(result => result.status === 'FAIL') || runtimeErrors.length) process.exitCode = 1;
