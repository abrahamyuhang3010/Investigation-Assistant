import fs from 'node:fs/promises';
import path from 'node:path';

let pw;
try { pw=await import('playwright'); }
catch { pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const out=path.resolve(import.meta.dirname,'../../docs/design-audit-2026-10-02/evidence/prompt-02');
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const context=await browser.newContext({viewport:{width:1363,height:936},deviceScaleFactor:1,colorScheme:'light'});
await context.addInitScript(()=>localStorage.clear());
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const captures=[];
const open=async id=>{await page.goto(`${base}/#/${id}`);await page.locator('#view-state').waitFor();await page.waitForTimeout(180)};
const capture=async(name,state,extra={})=>{
  await page.locator('#view-state').selectOption({label:state});
  await page.locator('.view-state-feedback').waitFor();
  await page.waitForTimeout(120);
  await page.locator('#toast').waitFor({state:'hidden',timeout:5000});
  const file=path.join(out,name);
  await page.screenshot({path:file});
  captures.push({file:name,route:locationFor(page),state,theme:await page.locator('html').getAttribute('data-theme'),viewport:'1363×936',deviceScaleFactor:1,zoom:'100%',...extra});
};
const locationFor=page=>new URL(page.url()).hash.replace('#/','');

await open('PG12');
await capture('R06-PG12-partial.png','部分数据',{data:'2 条本地合成案件'});
await page.locator('[data-action="view-state-retry-missing"]').click();
await capture('R06-PG12-stale.png','数据过期',{data:'最新可获得更新时间 2026-09-19'});

await open('PG13');
await capture('R06-PG13-partial.png','部分数据',{data:'A2026-0912'});
await page.locator('[data-action="view-state-retry-missing"]').click();
await capture('R06-PG13-stale.png','数据过期',{data:'A2026-0912；更新时间 2026-09-19'});

await open('PG14');
const host=page.locator('event-workflow');
await host.locator('#task-rows tr').first().waitFor();
const task=host.locator('#task-rows tr').filter({hasText:'Task2026090002'});
await task.locator('[data-action="task-detail"]').click();
await host.locator('[data-action="enter-graph"]').click();
await host.locator('.graph-node[data-node="network-abmen"]').waitFor();
await capture('R06-PG14-graph-partial.png','部分数据',{data:'Task2026090002；rootEntityId network-abmen'});
await page.locator('[data-action="view-state-retry-missing"]').click();
await capture('R06-PG14-graph-stale.png','数据过期',{data:'Task2026090002；数据更新时间未提供；任务创建时间 2026-09-28 09:30:00'});
await page.locator('[data-action="view-state-refresh"]').click();
await page.locator('[data-action="theme"]').click();
await capture('R06-PG14-graph-partial-dark.png','部分数据',{data:'深色主题矩阵检查；Task2026090002；rootEntityId network-abmen'});

const metadata={generatedAt:new Date().toISOString(),base,viewport:{width:1363,height:936},deviceScaleFactor:1,zoom:'100%',syntheticData:true,realApi:false,errors,captures};
await fs.writeFile(path.join(out,'screenshot-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
await browser.close();
if(errors.length)throw new Error(errors.join('\n'));
console.log(JSON.stringify(metadata,null,2));
