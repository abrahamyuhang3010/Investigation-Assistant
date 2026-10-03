import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../audit/event-workflow-correction-2026-10-01');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const b=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const p=await b.newPage({viewport:{width:1288,height:824}}), results=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));
const route=async id=>{await p.goto(`${base}/#/${id}`);await p.mouse.move(0,0);await p.waitForTimeout(650)};
async function test(name,fn){await fn();results.push({name,status:'PASS'})}
const shell=()=>p.locator('.header').evaluate(el=>{const r=el.getBoundingClientRect();return {text:el.innerText.replace(/因案研判|因事研判|案件串并/g,'业务页'),height:r.height,width:r.width,background:getComputedStyle(el).backgroundColor,font:getComputedStyle(el).fontFamily}});
const imageDifferenceRatio=async(expected,actual)=>p.evaluate(async({expected,actual})=>{
  const decode=async base64=>{const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));return createImageBitmap(new Blob([bytes],{type:'image/png'}));};
  const [a,b]=await Promise.all([decode(expected),decode(actual)]);
  if(a.width!==b.width||a.height!==b.height)return 1;
  const canvas=new OffscreenCanvas(a.width,a.height),ctx=canvas.getContext('2d');
  ctx.drawImage(a,0,0);const left=ctx.getImageData(0,0,a.width,a.height).data;
  ctx.clearRect(0,0,a.width,a.height);ctx.drawImage(b,0,0);const right=ctx.getImageData(0,0,a.width,a.height).data;
  let changed=0;for(let i=0;i<left.length;i+=4){if(Math.max(Math.abs(left[i]-right[i]),Math.abs(left[i+1]-right[i+1]),Math.abs(left[i+2]-right[i+2]),Math.abs(left[i+3]-right[i+3]))>10)changed+=1;}
  return changed/(a.width*a.height);
},{expected:expected.toString('base64'),actual:actual.toString('base64')});
const assertVisuallyStable=async(actual,expected,label)=>{const ratio=await imageDifferenceRatio(expected,actual);assert(ratio<0.001,`${label} screenshot differs: ${(ratio*100).toFixed(3)}% pixels changed`)};
let originalShell,pg12Baseline;
await test('PG12采用本次列表规范，PG17仍与修复前基线一致',async()=>{await route('PG12');pg12Baseline=await p.screenshot({path:path.join(out,'after-PG12.png')});assert.equal((await p.locator('.case-list-footer').innerText()).trim(),'共 2 条');assert(!/合成记录|当前全部展示|中间字段可横向滚动/.test(await p.locator('.case-list-panel').innerText()));originalShell=await shell();await route('PG17');const image=await p.screenshot({path:path.join(out,'after-PG17.png')});await assertVisuallyStable(image,await fs.readFile(path.join(out,'before-PG17.png')),'PG17')});
await route('PG14');const f=p.locator('event-workflow');
await test('PG14沿用原导航及共享标题组件，无iframe及内嵌导航',async()=>{assert.deepEqual(await shell(),originalShell);assert.equal(await p.locator('iframe').count(),0);assert.equal(await f.locator('header,.header,.top-nav').count(),0);const h=p.locator('.case-workbench-heading');assert(await h.isVisible());assert(await h.locator('.case-workbench-icon').isVisible());assert((await h.innerText()).includes('因事研判'));assert.equal(await p.locator('.header').count(),1)});
await test('新建弹窗焦点圈定、Escape恢复焦点及背景交互',async()=>{const trigger=f.locator('[data-action=new-task]');await trigger.click();assert(await p.locator('.header').evaluate(el=>el.inert));for(let i=0;i<35;i++){await p.keyboard.press('Tab');assert(await f.evaluate(el=>el.shadowRoot.querySelector('#create-dialog').contains(el.shadowRoot.activeElement)))}await p.keyboard.press('Escape');assert(await trigger.evaluate(el=>el===el.getRootNode().activeElement));assert.equal(await p.locator('.header').evaluate(el=>el.inert),false);assert.equal(await p.locator('body').evaluate(el=>el.style.overflow),'')});
await test('主题切换和路由切换保留正文筛选值且不另设主题',async()=>{await f.locator('#task-search').fill('0001');await p.locator('.header [data-action=theme]').click();assert.equal(await f.getAttribute('data-theme'),'dark');assert.equal(await f.locator('#task-search').inputValue(),'0001');await p.locator('.header [data-action=theme]').click();await route('PG12');await route('PG14');assert.equal(await f.locator('#task-search').inputValue(),'0001');await f.locator('#task-search').fill('')});
await test('已有实体按类型查询，银行卡不返回人员记录',async()=>{await f.locator('[data-action=new-task]').click();await f.locator('#create-entity-type').selectOption('银行卡');await f.locator('input[name=create-new][value=no]').check();await f.locator('#create-lookup').fill('唐利岩');assert.equal(await f.locator('#create-results [data-action=select-existing]').count(),0);await p.keyboard.press('Escape')});
await test('菜单键盘导航、Escape归还焦点，导图实体无重叠',async()=>{await f.locator('[data-action=task-detail]').first().click();await f.locator('[data-action=enter-graph]').click();await f.locator('[data-action=card-menu][data-id=network-wxid-zs001]').click();await p.keyboard.press('End');assert(await f.locator('.card-menu button').last().evaluate(el=>el===el.getRootNode().activeElement));await p.keyboard.press('Escape');assert(await f.locator('[data-action=card-menu][data-id=network-wxid-zs001]').evaluate(el=>el===el.getRootNode().activeElement));const rects=await f.locator('.graph-node').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],c=rects[j];assert(!(a.x<c.x+c.w&&a.x+a.w>c.x&&a.y<c.y+c.h&&a.y+a.h>c.y),`nodes ${i}/${j} overlap`)}});
await test('离开打开的弹窗恢复滚动，访问PG14后兄弟页仍保持各自基线',async()=>{await f.locator('[data-action=back-list]').click();await f.locator('[data-action=new-task]').click();for(const id of ['PG12','PG17']){await route(id);assert.equal(await p.locator('body').evaluate(el=>el.style.overflow),'');const expected=id==='PG12'?pg12Baseline:await fs.readFile(path.join(out,`before-${id}.png`));const actual=await p.screenshot({path:path.join(out,`after-visit-${id}.png`)});if(id==='PG12')assert(actual.equals(expected),id+' changed after event page');else await assertVisuallyStable(actual,expected,id+' changed after event page')}});
assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'isolation-results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));await b.close();
