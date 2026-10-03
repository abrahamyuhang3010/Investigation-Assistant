import assert from 'node:assert/strict';
import path from 'node:path';
import {normalizeViewState,viewStateModel} from '../src/view-state.js';

let pw;
try { pw=await import('playwright'); }
catch { pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

assert.deepEqual(normalizeViewState('部分数据'),{label:'部分数据',key:'partial',fallback:false});
assert.deepEqual(normalizeViewState('数据过期'),{label:'数据过期',key:'stale',fallback:false});
assert.equal(normalizeViewState('未知值').fallback,true);
assert.equal(viewStateModel('PG12','部分数据',{}).preserveContent,true);
assert.equal(viewStateModel('PG12','数据过期',{}).preserveContent,true);

const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const context=await browser.newContext({viewport:{width:1363,height:936},deviceScaleFactor:1});
await context.addInitScript(()=>localStorage.clear());
const page=await context.newPage();
const errors=[],results=[];
page.on('pageerror',error=>errors.push(error.message));

const route=async id=>{
  await page.goto(`${base}/#/${id}`);
  await page.locator('#view-state').waitFor();
  await page.waitForTimeout(120);
};
const selectState=async label=>{
  await page.locator('#view-state').selectOption({label});
  if(label!=='正常')await page.locator('.view-state-feedback').waitFor();
};
const feedbackText=()=>page.locator('.view-state-feedback').innerText();
const recover=async action=>{
  await page.locator(`[data-action="${action}"]`).click();
  await page.waitForFunction(()=>document.querySelector('#view-state')?.value==='正常');
};
async function test(name,fn){
  const before=errors.length;
  try { await fn();assert.equal(errors.length,before,'浏览器运行时出现错误');results.push({name,status:'PASS'}); }
  catch(error){results.push({name,status:'FAIL',error:error.message});throw error;}
}

const cases=[
  ['加载中','loading','正在加载当前页面数据','view-state-loading-complete'],
  ['空状态','empty','首次进入暂无数据','view-state-load-demo'],
  ['加载失败','error','页面数据加载失败','view-state-retry'],
  ['部分数据','partial','部分数据可用','view-state-retry-missing'],
  ['无权限','permission','当前范围无访问权限','view-state-exit-permission-demo'],
  ['数据过期','stale','数据快照已过期','view-state-refresh']
];

await test('PG12 六种异常状态语义与恢复动作',async()=>{
  await route('PG12');
  for(const [label,key,title,action] of cases){
    await selectState(label);
    assert.equal(await page.locator('.view-state-feedback').getAttribute('data-view-state'),key);
    assert.match(await feedbackText(),new RegExp(title));
    if(label==='部分数据'){
      assert(await page.locator('.case-list-panel').isVisible(),'部分数据应保留案件列表');
      assert.doesNotMatch(await feedbackText(),/当前数据快照已过期/);
    }
    if(label==='数据过期'){
      assert(await page.locator('.case-list-panel').isVisible(),'过期状态应保留旧案件列表');
      assert.match(await feedbackText(),/数据更新时间：2026-09-19/);
    }
    if(label==='空状态')assert.doesNotMatch(await feedbackText(),/没有符合条件的案件/);
    if(label==='无权限'){
      assert.equal(await page.locator('[data-action="access-route"]').count(),0);
      assert.match(await feedbackText(),/没有可执行的权限申请能力/);
    }
    await recover(action);
    assert.match(await page.locator('.case-list-panel').innerText(),/A2026-0912/);
  }
});

await test('PG13 六种异常状态区分且案件上下文不漂移',async()=>{
  await route('PG13');
  for(const [label,key,title,action] of cases){
    await selectState(label);
    assert.equal(await page.locator('.view-state-feedback').getAttribute('data-view-state'),key);
    assert.match(await feedbackText(),new RegExp(title));
    assert.match(await feedbackText(),/A2026-0912/);
    if(label==='部分数据'||label==='数据过期')assert(await page.locator('.cd-detail').isVisible(),'部分或过期状态应保留案件详情');
    if(label==='数据过期')assert.match(await feedbackText(),/数据更新时间：2026-09-19/);
    await recover(action);
    assert.match(await page.locator('.cd-detail').innerText(),/A2026-0912/);
  }
});

await test('PG14 内部导图六种异常状态恢复后保留任务与根实体',async()=>{
  await route('PG14');
  const host=page.locator('event-workflow');
  await host.locator('#task-rows tr').first().waitFor();
  const task=host.locator('#task-rows tr').filter({hasText:'Task2026090002'});
  await task.locator('[data-action="task-detail"]').click();
  await host.locator('[data-action="enter-graph"]').click();
  await host.locator('.graph-node[data-node="network-abmen"]').waitFor();
  for(const [label,key,title,action] of cases){
    await selectState(label);
    assert.equal(await page.locator('.view-state-feedback').getAttribute('data-view-state'),key);
    const text=await feedbackText();
    assert.match(text,new RegExp(title));
    assert.match(text,/Task2026090002/);
    assert.match(text,/network-abmen/);
    if(label==='部分数据'||label==='数据过期'){
      assert(await host.isVisible(),'部分或过期状态应保留内部导图');
      assert(await host.locator('.graph-node[data-node="network-abmen"]').isVisible());
    }
    if(label==='数据过期'){
      assert.match(text,/数据更新时间：未提供/);
      assert.match(text,/任务创建时间：2026-09-28 09:30:00/);
      assert.doesNotMatch(text,/快照更新时间：2026-09-28/);
    }
    await recover(action);
    await host.locator('.graph-node[data-node="network-abmen"]').waitFor();
    assert(await host.locator('.graph-node[data-node="network-abmen"]').isVisible());
    assert.match(await host.locator('#graph-task-name').innerText(),/Task2026090002/);
  }
});

assert.equal(errors.length,0,errors.join('\n'));
console.log(JSON.stringify({suite:'view-state',status:'PASS',checks:results},null,2));
await browser.close();
