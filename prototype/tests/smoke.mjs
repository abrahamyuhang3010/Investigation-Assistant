import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../audit/prototype-2026-09-19');await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PROTOTYPE_URL||'http://127.0.0.1:4186');await page.screenshot({path:path.join(out,'workbench-light.png')});
for(let i=1;i<=34;i++){const id='PG'+String(i).padStart(2,'0');await page.evaluate(async id=>{const {state,save}=await import('/src/state.js');state.role=['PG30','PG31','PG32','PG34'].includes(id)?'平台管理员':id==='PG27'?'审批人员':id==='PG33'?'业务负责人':'研判人员';state.loggedIn=true;state.permission=true;state.viewState='正常';save();location.hash='/'+id},id);await page.waitForTimeout(60);results.push({id,title:await page.title(),main:await page.locator('#main').innerText().then(x=>x.slice(0,100)),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});}
await fs.writeFile(path.join(out,'smoke.json'),JSON.stringify({testedAt:new Date().toISOString(),errors,results},null,2));console.log(JSON.stringify({errors,pages:results.length,overflow:results.filter(r=>r.overflow)},null,2));await browser.close();assert.equal(errors.length,0);assert(results.every(r=>r.main&&!r.overflow));
