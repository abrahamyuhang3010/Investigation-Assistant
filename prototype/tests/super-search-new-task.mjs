import assert from 'node:assert/strict';
import path from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const results=[],errors=[];
const starterLabels=['资金分析','人员分析','警情问答','网络分析'];
const starterAssets=['fund-analysis','person-analysis','alert-qa','network-analysis'];
async function open(width){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900}}),page=await context.newPage();
 page.on('pageerror',error=>errors.push({width,error:error.message}));
 await page.goto(base+'/#/PG05');
 await page.evaluate(async()=>{(await import('/src/state.js')).reset()});
 await page.goto(base+'/#/PG04');
 await page.locator('.super-search-page[data-new-task="true"]').waitFor();
 return {context,page};
}
for(const width of [390,1024,1440]){
 const {context,page}=await open(width);
 try{
  assert.equal(await page.locator('.global-nav a', {hasText:'超级搜索'}).getAttribute('href'),'#/PG04');
  assert.equal(await page.locator('.search-sidebar').count(),0,'legacy sidebar should not render');
  assert.equal(await page.locator('.ss-sidebar').count(),1);
  assert.equal(await page.locator('.ss-center.ss-new-task').count(),1);
  assert.equal(await page.locator('.ss-new-task-welcome h1').innerText(),'全警智搜，精准研判');
  assert.equal(await page.locator('.ss-new-task-lead').innerText(),'作为AI支持的警务对话引擎，我可以回答您的问题，为您提供有用的线索信息，辅助您的日常警务工作');
  assert.deepEqual(await page.locator('.ss-new-task-starter strong').allInnerTexts(),starterLabels);
  assert.equal(await page.locator('.ss-new-task-starter').count(),4);
  const icons=await page.locator('.ss-new-task-starter .ss-starter-icon img').evaluateAll(images=>images.map(image=>({path:new URL(image.src).pathname,loaded:image.complete&&image.naturalWidth>0})));
  assert.equal(icons.length,8);
  for(const asset of starterAssets){
   assert(icons.some(icon=>icon.path===`/assets/super-search/${asset}.svg`&&icon.loaded),`${asset}.svg 未加载`);
   assert(icons.some(icon=>icon.path===`/assets/super-search/${asset}-dark.svg`&&icon.loaded),`${asset}-dark.svg 未加载`);
  }
  assert.equal(await page.locator('.ss-session-row.active').count(),0,'new task must not mark the previous session active');
  assert.equal(await page.locator('.super-search-page .ss-agent-card').count(),0,'new task must not expose current session agents');
  assert.equal(await page.locator('.super-search-page .ss-artifact-row').count(),0,'new task must not expose current session files');
  assert(await page.locator('.super-search-page').evaluate(element=>element.classList.contains('ss-right-collapsed')),'new task workspace should default to collapsed');
  const launcher=page.locator('[data-action="super-pane-expand"][data-pane="right"]').filter({visible:true}).first();
  await launcher.waitFor();
  assert.equal(await launcher.locator('xpath=..').locator('[role="progressbar"]').count(),0,'new task launcher must not show progress before execution');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow');
  await launcher.click();
  if(width<1320){
   const drawer=page.locator('#overlay .ss-workspace');await drawer.waitFor();
   assert.equal(await drawer.getAttribute('data-empty'),'true');
   assert.equal(await drawer.locator('.ss-agent-card').count(),0);
   await drawer.locator('[data-action="super-workspace-tab"][data-tab="文档空间"]').click();
   assert.match(await page.locator('#overlay .ss-empty-workspace').innerText(),/暂无任务文档/);
   await page.keyboard.press('Escape');
  }else{
   const workspace=page.locator('.super-search-page .ss-workspace');await workspace.waitFor({state:'visible'});
   assert.equal(await workspace.getAttribute('data-empty'),'true');
   assert.match(await page.locator('.super-search-page .ss-empty-workspace').innerText(),/任务尚未开始/);
   const emptyIconStyles=[];
   for(const tabName of ['工作空间','文档空间','导图空间']){
    const tab=workspace.locator(`[data-action="super-workspace-tab"][data-tab="${tabName}"]`);
    await tab.click();
    const activeColors=await tab.evaluate(element=>({button:getComputedStyle(element).color,icon:getComputedStyle(element.querySelector('.ss-workspace-icon')).backgroundColor}));
    assert.equal(activeColors.icon,activeColors.button,`${tabName}选中态图标必须继承标签颜色`);
    emptyIconStyles.push(await workspace.locator('.ss-empty-workspace .ss-workspace-icon').evaluate(element=>{const style=getComputedStyle(element);return {width:style.width,height:style.height,color:style.backgroundColor};}));
   }
   assert.deepEqual(emptyIconStyles.map(({width,height})=>({width,height})),Array(3).fill({width:'24px',height:'24px'}),'三个空间缺省图标尺寸必须一致');
   assert.equal(new Set(emptyIconStyles.map(item=>item.color)).size,1,'工作空间、文档空间与导图空间的缺省图标颜色必须一致');
  }
  results.push({width,status:'PASS'});
 }catch(error){results.push({width,status:'FAIL',error:error.stack})}
 console.log(results.at(-1));await context.close();
}
{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 try{
  await page.goto(base+'/#/PG02');
  await page.evaluate(async()=>{(await import('/src/state.js')).reset()});
  await page.locator('.global-nav a', {hasText:'超级搜索'}).click();
  await page.waitForURL(/#\/PG04$/);
  assert.equal(await page.evaluate(async()=>(await import('/src/state.js')).routeForFeature('SRCH03')),'PG04');
  results.push({width:'entry',status:'PASS'});
 }catch(error){results.push({width:'entry',status:'FAIL',error:error.stack})}
 console.log(results.at(-1));await context.close();
}
{
 const {context,page}=await open(1440);
 try{
  const before=await page.evaluate(async()=>(await import('/src/state.js')).state.sessions.length);
  await page.locator('#prompt').fill('核查演示账户B近7天交易');
  await page.reload();await page.locator('.super-search-page[data-new-task="true"]').waitFor();
  assert.equal(await page.locator('#prompt').inputValue(),'核查演示账户B近7天交易','draft should persist');
  await page.locator('#composer-form').evaluate(form=>form.requestSubmit());
  await page.waitForURL(/#\/PG05/);await page.locator('.super-search-page:not([data-new-task])').waitFor();
  assert.equal(await page.evaluate(async()=>(await import('/src/state.js')).state.sessions.length),before+1);
  results.push({width:'submit',status:'PASS'});
 }catch(error){results.push({width:'submit',status:'FAIL',error:error.stack})}
 console.log(results.at(-1));await context.close();
}
console.log(`${results.filter(result=>result.status==='PASS').length}/${results.length}; runtime errors: ${errors.length}`);
await browser.close();
if(results.some(result=>result.status==='FAIL')||errors.length)process.exitCode=1;
