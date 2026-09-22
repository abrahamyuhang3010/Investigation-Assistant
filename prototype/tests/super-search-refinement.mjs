import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186',out=path.resolve(import.meta.dirname,'../../audit/super-search-refinement-2026-09-22');await fs.mkdir(out,{recursive:true});
let p,ctx;const results=[],errors=[];
const click=async(action,extra='')=>{const sel=`[data-action="${action}"]${extra}`,overlay=p.locator('#overlay '+sel).filter({visible:true});await (await overlay.count()?overlay:p.locator(sel).filter({visible:true})).first().click()};
const shot=name=>p.screenshot({path:path.join(out,name+'.png')});
const snap=()=>p.evaluate(async()=>structuredClone((await import('/src/super-search-model.js')).ensureSuperSearchState()));
async function waitFor(fn){const end=Date.now()+20000;while(!await p.evaluate(fn)){if(Date.now()>end)throw Error('Timed out waiting for UI/model');await new Promise(r=>setTimeout(r,100));}}
async function test(name,fn){ctx=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});p=await ctx.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push({name,error:e.message}));try{await p.goto(base+'/#/PG05');await p.locator('.super-search-page').waitFor();await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.stack});await shot('failure-'+results.length)}finally{console.log(results.at(-1));await ctx.close()}}
await test('两侧独立收起/展开、刷新持久化和收起后的实时任务进度',async()=>{
 const center=await p.locator('.ss-center').boundingBox();
 await click('super-pane-collapse','[data-pane="left"]');assert(!await p.locator('.ss-sidebar').isVisible());assert(await p.locator('.ss-expand-left').isVisible());assert((await p.locator('.ss-center').boundingBox()).width>center.width+200);
 await click('super-pane-collapse','[data-pane="right"]');assert(!await p.locator('.super-search-page .ss-workspace').isVisible());assert.match(await p.locator('.ss-expand-right').innerText(),/2\/5/);await shot('both-collapsed');
 await p.reload();assert(!await p.locator('.ss-sidebar').isVisible());assert(!await p.locator('.super-search-page .ss-workspace').isVisible());
 await click('super-permission-apply','[data-id="PERM-NET"]');await waitFor(async()=>((await import('/src/super-search-model.js')).ensureSuperSearchState().query.status==='done'));
 assert.match(await p.locator('.ss-expand-right').innerText(),/5\/5/);assert.equal(await p.locator('.ss-mini-progress').getAttribute('aria-valuenow'),'5');await shot('collapsed-complete');
 await click('super-pane-expand','[data-pane="left"]');assert(await p.locator('.ss-sidebar').isVisible());assert(!await p.locator('.super-search-page .ss-workspace').isVisible());
 await click('super-task-source','[data-id="ST-01"]');assert(await p.locator('.super-search-page .ss-workspace').isVisible());assert(await p.locator('.ss-tool.is-highlighted').isVisible());
});
await test('任务列表精简、搜索持久化、会话菜单键盘、置顶及重命名/归档',async()=>{
 const sidebar=await p.locator('.ss-sidebar').innerText();assert(!/检索计划|本地快照|历史会话与|会话 S-|查看全部历史/.test(sidebar));
 const search=p.locator('#super-history-search');await search.fill('不存在的历史对话');assert.equal(await p.locator('.ss-session-row:visible').count(),0);assert(await p.locator('.ss-history-empty').isVisible());await p.reload();assert.equal(await search.inputValue(),'不存在的历史对话');await search.fill('');assert.equal(await p.locator('.ss-session-row:visible').count(),2);
 await click('super-session-menu','[data-id="S-0819"]');assert(await p.locator('.ss-session-menu').isVisible());await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'super-session-pin');await p.keyboard.press('Escape');assert.equal(await p.locator('.ss-session-menu').count(),0);
 await click('super-session-menu','[data-id="S-0819"]');await click('super-session-pin','[data-id="S-0819"]');assert.equal(await p.locator('.ss-session-row').first().getAttribute('data-session-id'),'S-0819');await p.reload();assert.equal(await p.locator('.ss-session-row').first().getAttribute('data-session-id'),'S-0819');
 await click('super-session-menu','[data-id="S-0819"]');await click('super-session-rename','[data-id="S-0819"]');await p.locator('#overlay input[name="name"]').fill('历史检索·重命名测试');await p.locator('#overlay button[type="submit"]').click();assert.match(await p.locator('.ss-session-row').first().innerText(),/历史检索·重命名测试/);
 await click('super-session-menu','[data-id="S-0819"]');await click('super-session-archive','[data-id="S-0819"]');assert.match(await p.locator('#overlay').innerText(),/归档只影响/);await p.locator('#overlay .btn.primary').click();assert.equal(await p.locator('.ss-session-row').count(),1);
 await click('new-search');await p.waitForURL('**/#/PG04');await p.locator('#composer-form').waitFor({state:'visible'});
});
await test('上传 SVG 资源、紧凑工具行、文件资源图标和来源/下载操作',async()=>{
 assert.equal(await p.locator('.ss-agent-art img').count(),4);assert(await p.locator('.ss-agent-art img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth===100)));assert.equal(await p.locator('.ss-tool').count(),9);
 const row=await p.locator('.ss-tool-row').first().boundingBox();assert(row.height<45);await shot('workspace');
 await click('super-tool-toggle','[data-id="TOOL-NET"]');assert(await p.locator('.ss-tool.waiting_approval .ss-tool-detail').isVisible());await shot('permission-detail');
 await click('super-workspace-tab','[data-tab="文档空间"]');assert.equal(await p.locator('.ss-file-type').count(),5);await p.waitForFunction(()=>[...document.querySelectorAll('.ss-file-type,.ss-folder-icon img')].every(img=>img.complete&&img.naturalWidth===100));assert.equal(await p.locator('.ss-file-type[data-file-type="XLSX"]').first().getAttribute('data-icon-kind'),'excel');assert.match(await p.locator('.ss-file-type[data-file-type="ZIP"]').getAttribute('src'),/file-icons\/zip\.svg$/);assert(await p.locator('.ss-folder-light').first().isVisible());assert(!await p.locator('.ss-folder-dark').first().isVisible());
 const artifact=p.locator('[data-artifact-id="ART-FLOW"]');await artifact.hover();assert.equal(await artifact.locator('.ss-file-actions').evaluate(e=>getComputedStyle(e).opacity),'1');await shot('documents-hover');
 await click('super-file-preview','[data-id="ART-FLOW"]');assert(await p.locator('.ss-table-preview').isVisible());await click('close');
 await click('super-file-locate','[data-id="ART-FLOW"]');assert(await p.locator('[data-tool-id="TOOL-FLOW"].is-highlighted').isVisible());
 await click('theme');assert(await p.locator('.ss-agent-dark').first().isVisible());assert(!await p.locator('.ss-agent-light').first().isVisible());await shot('workspace-dark');await click('super-workspace-tab','[data-tab="文档空间"]');assert(await p.locator('.ss-folder-dark').first().isVisible());assert(!await p.locator('.ss-folder-light').first().isVisible());
});
await test('新输入框、三条快捷问题、自动增高、Shift+Enter 与输入法保护',async()=>{
 const prompt=p.locator('#super-search-prompt'),send=p.locator('#super-search-composer [type="submit"]');assert(await send.isDisabled());assert.equal(await p.locator('.ss-recommendations button').count(),3);
 const inputBox=await prompt.boundingBox(),attachment=await p.locator('#super-search-composer [data-action="super-upload"]').boundingBox();assert(attachment.x<inputBox.x);
 await p.locator('.ss-recommendations button').first().click();assert((await prompt.inputValue()).length>0);assert(await send.isEnabled());
 await prompt.fill('第一行');const before=await prompt.boundingBox();await prompt.press('Shift+Enter');await prompt.press('a');assert((await prompt.boundingBox()).height>before.height);assert.equal((await snap()).queries.length,1);
 await prompt.dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true,keyCode:229,bubbles:true});assert.equal((await snap()).queries.length,1);
 await p.reload();assert.equal(await prompt.inputValue(),'第一行\na');await prompt.fill('   ');assert(await send.isDisabled());await prompt.fill('核验资金来源');await prompt.press('Enter');assert.equal((await snap()).queries.length,2);assert(await send.isDisabled());
});
await test('桌面/窄屏适配、任务抽屉搜索与切换、工作空间来源自动打开',async()=>{
 for(const width of [1920,1600,1440,1280,1200,1199,1024,900,768,390]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflow '+width);assert((await p.locator('.ss-center').boundingBox()).width>300,'center width '+width);if([1440,390].includes(width))await shot('layout-'+width);}
 await click('super-pane-expand','[data-pane="left"]');assert(await p.locator('#overlay .ss-sidebar').isVisible());await p.locator('#overlay #super-history-search').fill('演示账户');assert.equal(await p.locator('#overlay .ss-session-row:visible').count(),1);
 await click('super-session-menu','[data-id="S-0819"]');assert(await p.locator('#overlay .ss-session-menu').isVisible());await click('super-session-pin','[data-id="S-0819"]');await shot('mobile-task-list');
 await click('super-session-open','[data-id="S-0819"]');assert.equal(await p.locator('#overlay .ss-sidebar').count(),0);await click('super-task-source','[data-id="ST-01"]');assert(await p.locator('#overlay .ss-workspace').isVisible());await click('super-workspace-tab','[data-tab="文档空间"]');await p.locator('#overlay [role=tab][aria-selected=true]').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>document.activeElement.closest('#overlay')?.id),'overlay');assert.equal(await p.locator('#overlay [role=tab][aria-selected=true]').innerText(),'导图空间');await p.keyboard.press('ArrowLeft');await shot('mobile-files');await click('super-pane-collapse','[data-pane="right"]');assert(await p.locator('.ss-expand-right').isVisible());
});
await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));await browser.close();console.log(`${results.filter(r=>r.status==='PASS').length}/${results.length}; runtime errors: ${errors.length}`);if(results.some(r=>r.status==='FAIL')||errors.length)process.exitCode=1;
