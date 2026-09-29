import assert from 'node:assert/strict';
import path from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const results=[],errors=[];
async function reset(page){await page.goto(base+'/#/PG05');await page.evaluate(async()=>{(await import('/src/state.js')).reset()});await page.goto(base+'/#/PG04');await page.locator('.super-search-page[data-new-task="true"]').waitFor();}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();page.on('pageerror',error=>errors.push({name,error:error.message}));try{await reset(page);await fn(page);results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}console.log(results.at(-1));await context.close();}
const composerSignature=locator=>locator.evaluate(form=>[...form.querySelector('.composer-inner').children].map(node=>({tag:node.tagName,action:node.dataset.action||'',type:node.getAttribute('type')||'',icon:node.querySelector('.ss-dify-icon')?.className||''})));
await run('新任务与历史任务使用同一 Query composer 和 Dify 图标',async page=>{
 const newComposer=page.locator('#composer-form');
 assert.equal(await page.locator('.ss-new-task-safety,.ss-new-task-hint,[data-action="expand-input"]').count(),0);
 const signature=await composerSignature(newComposer);
 assert.deepEqual(signature.map(item=>item.action),['super-composer-menu','','']);
 assert.match(signature[0].icon,/ss-dify-icon-attach/);assert.match(signature[2].icon,/ss-dify-icon-send/);
 await newComposer.locator('[data-action="super-composer-menu"]').click();
 const menu=page.locator('.ss-composer-menu');await menu.waitFor();
 assert.deepEqual(await menu.locator('button').allInnerTexts(),['添加照片和文件','工具和Skills','深度思考']);
 const menuMetrics=await menu.evaluate(el=>{const deep=el.querySelector('[data-action="super-composer-deep"]'),divider=getComputedStyle(deep,'::before');return {width:el.getBoundingClientRect().width,dividerHeight:divider.height,dividerColor:divider.backgroundColor};});assert(menuMetrics.width<=220,'菜单宽度应随内容收窄');assert.equal(menuMetrics.dividerHeight,'1px');assert.notEqual(menuMetrics.dividerColor,'rgba(0, 0, 0, 0)');
 assert.equal(await menu.locator('[data-action="super-composer-deep"]').getAttribute('aria-checked'),'true');
 assert.equal(await menu.locator('.ss-dify-icon-image,.ss-dify-icon-tools,.ss-dify-icon-brain').count(),3);
 await page.locator('.ss-new-task-welcome h1').click();assert.equal(await page.locator('.ss-composer-menu').count(),0,'点击外部应关闭菜单');
 await newComposer.locator('[data-action="super-composer-menu"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.ss-composer-menu').count(),0,'Escape 应关闭菜单');assert.equal(await newComposer.locator('[data-action="super-composer-menu"]').evaluate(el=>el===document.activeElement),true,'Escape 后焦点返回回形针按钮');
 await newComposer.locator('[data-action="super-composer-menu"]').click();await page.locator('.ss-composer-menu [data-action="super-composer-tools"]').click();
 const resourceForm=page.locator('#super-composer-tools-form');await resourceForm.waitFor();
 assert.match(await resourceForm.innerText(),/仅显示当前用户权限范围内可用的工具和 Skill/);
 const tools=resourceForm.locator('[name="tools"]'),skills=resourceForm.locator('[name="skills"]');assert(await tools.count()>0);assert(await skills.count()>0);await tools.first().check();await skills.first().check();await resourceForm.locator('[type="submit"]').click();await resourceForm.waitFor({state:'hidden'});
 await newComposer.locator('[data-action="super-composer-menu"]').click();await page.locator('.ss-composer-menu [data-action="super-composer-upload"]').click();
 const uploadForm=page.locator('#super-composer-upload-form');await uploadForm.waitFor();await uploadForm.locator('[name="file"]').setInputFiles({name:'线索照片说明.txt',mimeType:'text/plain',buffer:Buffer.from('合成测试材料')});await uploadForm.locator('[type="submit"]').click();await uploadForm.waitFor({state:'hidden'});
 const chips=await newComposer.locator('.ss-composer-chips>span').allInnerTexts();assert.equal(chips.length,3,'文件、工具和 Skill 应可同时添加');assert(chips.includes('线索照片说明.txt'));
 await newComposer.locator('[data-action="super-composer-menu"]').click();const deepToggle=page.locator('.ss-composer-menu [data-action="super-composer-deep"]'),switchEl=deepToggle.locator('.ss-switch');await deepToggle.click();assert.equal(await deepToggle.getAttribute('aria-checked'),'false');assert.equal(await switchEl.evaluate(el=>el.classList.contains('is-changing')),true,'切换时应触发开关反馈动效');await page.waitForTimeout(260);assert((await switchEl.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el.querySelector('b')).transform).m41))<1,'关闭后滑块应平滑回到左侧');
 await page.locator('#prompt').fill('测试普通问答');await newComposer.evaluate(form=>form.requestSubmit());await page.waitForURL(/#\/PG05/);await page.locator('#super-search-composer').waitFor();
 const query=await page.evaluate(async()=>{const ss=(await import('/src/super-search-model.js')).ensureSuperSearchState();return {mode:ss.query.mode,status:ss.query.status,deep:ss.query.deepThinking,agents:ss.agents.length,files:ss.query.selectedFiles.length,tools:ss.query.selectedTools.length,skills:ss.query.selectedSkills.length,taskStatus:ss.query.subtasks[0].status};});
 assert.deepEqual(query,{mode:'quick',status:'done',deep:false,agents:0,files:1,tools:1,skills:1,taskStatus:'done'});
 const historyComposer=page.locator('#super-search-composer');assert.deepEqual(await composerSignature(historyComposer),signature);
 await historyComposer.locator('[data-action="super-composer-menu"]').click();assert.deepEqual(await page.locator('.ss-composer-menu button').allInnerTexts(),['添加照片和文件','工具和Skills','深度思考']);assert.equal(await page.locator('.ss-composer-menu [data-action="super-composer-deep"]').getAttribute('aria-checked'),'true','历史任务开关默认开启');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'390px 菜单不得产生横向溢出');
});
await run('关闭深度思考后快捷入口也不启动深度研判',async page=>{
 const composer=page.locator('#composer-form');await composer.locator('[data-action="super-composer-menu"]').click();await page.locator('.ss-composer-menu [data-action="super-composer-deep"]').click();await page.locator('.ss-new-task-starter').first().click();await page.waitForURL(/#\/PG05/);await page.locator('.super-search-page:not([data-new-task])').waitFor();
 const query=await page.evaluate(async()=>{const ss=(await import('/src/super-search-model.js')).ensureSuperSearchState();return {mode:ss.query.mode,status:ss.query.status,deep:ss.query.deepThinking,agents:ss.agents.length};});assert.deepEqual(query,{mode:'quick',status:'done',deep:false,agents:0});
});
console.log(`${results.filter(result=>result.status==='PASS').length}/${results.length}; runtime errors: ${errors.length}`);
await browser.close();if(results.some(result=>result.status==='FAIL')||errors.length)process.exitCode=1;
