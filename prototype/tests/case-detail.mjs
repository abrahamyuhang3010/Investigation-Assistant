/** Approved 924:2 case-detail acceptance. Run against the local prototype server. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const out=path.resolve(import.meta.dirname,'../../audit/case-detail-2026-09-22');await fs.mkdir(out,{recursive:true});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186',results=[],errors=[];let p,ctx;
const snap=()=>p.evaluate(async()=>structuredClone((await import('/src/state.js')).state));
const detail=async()=>{const s=await snap();return s.caseFlows[s.selectedCase].detail};
const click=async(a,x='')=>{await p.locator(`[data-action="${a}"]${x}`).first().click();};
const stage=async n=>{await click('case-stage',`[data-step="${n}"]`);};
const submit=async()=>{await p.locator('#modal-form [type=submit]').click();};
const open=async id=>{await p.goto(base+'/#/PG12');await click('open-case',`[data-id="${id||'CASE-0817'}"]`);await p.locator('.cd-detail').waitFor();};
const screenshot=async n=>{await p.locator('.cd-detail img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await p.screenshot({path:path.join(out,n+'.png')});};
async function test(name,fn){ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});p=await ctx.newPage();p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push({name,error:e.message}));try{await open();await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.stack});await screenshot('failure-'+results.length);}finally{console.log(results.at(-1));await ctx.close();}}
await test('Five approved stages, local assets, alignment, contained desktop scrolling',async()=>{
 assert.equal(await p.locator('.cd-stage-nav button').count(),5);
 assert.equal(await p.locator('.case-stepper,#case-material-form').count(),0);
 for(let i=0;i<5;i++){
  await stage(i);await screenshot('stage-'+i);
  const dimensions=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight}));assert.equal(dimensions.w,dimensions.width);assert(dimensions.h<=dimensions.height+1,JSON.stringify(dimensions));
  const icons=await p.locator('.cd-detail img').evaluateAll(xs=>xs.map(x=>({src:x.getAttribute('src'),loaded:x.complete&&x.naturalWidth>0})));
  assert(icons.every(x=>x.loaded&&x.src.startsWith('/assets/figma/')),JSON.stringify(icons));
  const misaligned=await p.locator('.cd-stage-nav button,.cd-btn').evaluateAll(xs=>xs.filter(x=>{const img=x.querySelector('img'),span=x.querySelector('span');if(!img||!span||!span.textContent.trim())return false;const a=img.getBoundingClientRect(),b=span.getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2)>1;}).map(x=>x.textContent));assert.deepEqual(misaligned,[]);
 }
});
await test('Forensic person switch updates account and transaction table',async()=>{
 await stage(1);assert.match(await p.locator('.cd-forensic-content').innerText(),/孙帝/);
 await click('cd-select-document','[data-id=forensic-2]');const text=await p.locator('.cd-forensic-content').innerText();assert.match(text,/孟昭鑫/);assert.match(text,/8846/);await screenshot('forensic-second');
 await click('cd-forensic-category','[data-id=person]');assert.match(await p.locator('.cd-forensic-content').innerText(),/孟昭鑫/);
});
await test('Transcript switch, per-document sources, Q&A, paging, collapse persistence',async()=>{
 await stage(2);assert.equal(await p.locator('.cd-entity-card').count(),4);
 assert.match(await p.locator('.cd-entity-card .cd-source-link').first().innerText(),/第1次笔录/);
 await click('cd-source','[data-id=transcript-1][data-page="2"]');assert.match(await p.getByRole('dialog').innerText(),/交易凭证/);await click('cd-locate-source');assert.equal((await detail()).page,2);
 await click('cd-select-document','[data-id=transcript-2]');assert.equal((await detail()).page,1);assert.equal(await p.locator('.cd-entity-card').count(),4);assert.match(await p.locator('.cd-pagination').innerText(),/共 5 条/);assert.match(await p.locator('.cd-paper').innerText(),/本次补充/);
 await click('cd-viewer-tab','[data-id=qa]');assert.match(await p.locator('.cd-viewer').innerText(),/无法确认/);await click('cd-viewer-tab','[data-id=detail]');
 await click('cd-page','[data-page="2"]');assert.match(await p.locator('.cd-paper').innerText(),/无法确认/);
 await click('cd-zoom','[data-delta="10"]');assert.equal((await detail()).zoom,110);
 await click('cd-collapse');assert.equal(await p.locator('.cd-document-list').count(),0);await screenshot('transcript-collapsed');await stage(0);await stage(2);await p.reload();assert((await detail()).collapsed);assert.equal((await detail()).transcriptId,'transcript-2');
 await click('cd-collapse');assert.equal(await p.locator('.cd-document-list').count(),1);
});
await test('Manual entity validation, safe text, graph layers and deletion',async()=>{
 await click('cd-add-entity');await p.locator('[name=title]').fill('<img src=x onerror=alert(1)>');await p.locator('[name=detail]').fill('人工补充测试');await p.locator('[name=page]').fill('99');await submit();assert.match(await p.locator('.form-error').innerText(),/实际存在/);await p.locator('[name=page]').fill('1');await submit();
 const e=(await detail()).entities.find(e=>e.origin==='人工补充');assert(e);assert.equal(await p.locator('.cd-entity-card img[src=x]').count(),0);
 await stage(3);assert.equal(await p.locator(`[data-node-id="${e.id}"]`).count(),1);
 await click('cd-graph-layer');await p.locator('select[name=layer]').selectOption('人工补充');await submit();assert.equal(await p.locator('.entity-node').count(),1);
 await click('cd-graph-clear');await click('cd-entity',`[data-id="${e.id}"]`);await click('cd-delete-entity');await submit();assert(!(await detail()).entities.some(x=>x.id===e.id));
});
await test('TXT import has no fabricated extraction; delete removes only its references',async()=>{
 await stage(2);await click('cd-upload');await p.locator('#cd-upload-file').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('自定义合成原文，不自动解析。')});await p.locator('[name=person]').fill('演示对象');await submit();const d=await detail(),id=d.transcriptId;assert.equal(d.sources.length,6);assert.equal(d.entities.length,11);assert.match(await p.locator('.cd-paper').innerText(),/自定义合成原文/);assert.equal(await p.locator('.cd-entity-card').count(),0);
 await click('cd-add-entity');await p.locator('[name=title]').fill('自定义来源实体');await p.locator('[name=detail]').fill('人工记录');await submit();assert.equal((await detail()).entities.length,12);
 await click('cd-delete-document');await submit();assert(!(await detail()).sources.some(s=>s.id===id));assert.equal((await detail()).entities.length,11);
});
await test('Graph focus/full/search/zoom/fullscreen and explicit simulated execution',async()=>{
 await stage(3);assert.equal(await p.locator('.entity-node').count(),7);await click('cd-graph-mode');assert.equal(await p.locator('.entity-node').count(),11);await click('cd-graph-mode');
 await click('node-zoom','[data-delta=".15"]');assert((await snap()).graphUI['case-detail-CASE-0817'].zoom);await click('node-fit');
 await click('cd-graph-search');await p.locator('[name=query]').fill('7288');await submit();assert.equal(await p.locator('.entity-node').count(),1);await click('cd-graph-clear');
 await click('cd-fullscreen');assert.equal(await p.locator('.cd-fullscreen').count(),1);await p.keyboard.press('Escape');assert.equal(await p.locator('.cd-fullscreen').count(),0);
 await click('cd-run');await click('case-pause');assert.equal((await snap()).caseFlows['CASE-0817'].run,'Paused');await click('case-resume');for(let i=0;i<3;i++)await click('case-advance');const f=(await snap()).caseFlows['CASE-0817'];assert.equal(f.run,'Success');assert(!JSON.stringify(f.events).includes('位置候选'));
});
await test('Report versioned frozen sources, stale detection and real .doc download',async()=>{
 await stage(4);await click('cd-generate-report');let d=await detail(),s=await snap();const old=s.reports.find(r=>r.id===d.reportId),original=JSON.stringify(old);assert.equal(old.caseSources.length,5);
 await click('cd-report-source');assert.match(await p.getByRole('dialog').innerText(),/冻结/);await click('close');
 await stage(0);await click('cd-edit-original');await p.locator('[name=text]').fill('已修改的本案合成材料');await submit();assert.equal(JSON.stringify((await snap()).reports.find(r=>r.id===old.id)),original);
 await stage(4);assert.equal(await p.locator('.cd-stale').count(),1);await click('cd-review');assert.match(await p.locator('#toast').innerText(),/重新生成/);
 await click('cd-generate-report');d=await detail();s=await snap();const r=s.reports.find(r=>r.id===d.reportId);assert.equal(r.version,2);assert.notEqual(r.id,old.id);
 await click('cd-export');await p.locator('[name=purpose]').fill('前端验收');await p.locator('[name=ack]').check();const downloadPromise=p.waitForEvent('download');await submit();const download=await downloadPromise;assert.match(download.suggestedFilename(),/\.doc$/);const text=await fs.readFile(await download.path(),'utf8');assert.match(text,/已修改的本案合成材料/);assert.match(text,/合成演示/);
 await click('cd-review');for(const box of await p.locator('#modal-form [type=checkbox]').all())await box.check();await submit();assert.match(p.url(),/PG25/);assert.equal((await snap()).reports.find(x=>x.id===r.id).status,'待复核');
});
await test('Two cases are isolated across materials, entities and reports',async()=>{
 await stage(2);await click('cd-select-document','[data-id=transcript-2]');await click('cd-collapse');await stage(4);await click('cd-generate-report');const first=structuredClone(await detail());
 await open('CASE-0802');let second=await detail();assert.equal(second.collapsed,false);assert.equal(second.transcriptId,'transcript-1');assert.match(second.original,/陈晓禾/);assert(!JSON.stringify(second).includes('张宝林'));assert(!JSON.stringify(second).includes('invest_demo'));
 await stage(4);await click('cd-generate-report');second=await detail();assert.notEqual(second.reportId,first.reportId);const r=(await snap()).reports.find(r=>r.id===second.reportId);assert.equal(r.caseId,'CASE-0802');assert(!r.content.includes('张宝林'));await screenshot('second-case-report');
 await open('CASE-0817');assert.deepEqual(await detail(),first);
});
await test('New cases start empty; custom material produces no invented report entities',async()=>{
 await p.goto(base+'/#/PG12');await click('case-import');await p.locator('[name=rows]').fill(JSON.stringify([{name:'空白合成验收案',number:'DEMO-EMPTY'}]));await submit();const id=(await snap()).cases.find(c=>c.number==='DEMO-EMPTY').id;await click('open-case',`[data-id="${id}"]`);assert.equal((await detail()).entities.length,0);await stage(4);assert.match(await p.locator('.cd-empty').innerText(),/尚无材料/);await stage(0);await click('cd-edit-original');await p.locator('[name=text]').fill('仅有一段合成原文');await submit();assert.equal((await detail()).entities.length,0);
});
await test('1024 / 390 layouts and dark theme retain content without document overflow',async()=>{
 for(const width of [1024,390]){await p.setViewportSize({width,height:900});for(let i=0;i<5;i++){await stage(i);const w=await p.evaluate(()=>document.documentElement.scrollWidth);assert(w<=width,`stage ${i}: ${w} > ${width}`);await screenshot(`responsive-${width}-${i}`);}}
 await p.setViewportSize({width:1440,height:900});await p.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.theme='dark';save()});await p.reload();await screenshot('dark-report');assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');
});

await test('Interrupted execution, reload, recovery, offline and reduced motion',async()=>{
 for(const [scenario,expected] of [['failure','Error'],['permission','Waiting'],['partial','Exception'],['empty','Exception']]){
  await p.evaluate(async scenario=>{const {state,save}=await import('/src/state.js');state.scenario=scenario;save()},scenario);await p.reload();await stage(3);await click('cd-run');await click('case-advance');if(scenario!=='empty')await click('case-advance');let f=(await snap()).caseFlows['CASE-0817'];assert.equal(f.run,expected);const tick=f.tick;await p.reload();assert.equal((await snap()).caseFlows['CASE-0817'].tick,tick);
  await p.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.scenario='success';save()});await p.reload();await click('case-resume');while((await snap()).caseFlows['CASE-0817'].run==='Running')await click('case-advance');assert.equal((await snap()).caseFlows['CASE-0817'].run,'Success');
 }
 await p.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.network=false;save()});await p.reload();await click('cd-run');assert.match(await p.locator('#toast').innerText(),/断线/);assert.equal((await snap()).caseFlows['CASE-0817'].run,'Success');
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.entity-node').first().evaluate(n=>getComputedStyle(n).animationName),'none');
});
await test('Report review cannot self-approve and preserves frozen JSON export',async()=>{
 await stage(4);await click('cd-generate-report');await click('cd-review');for(const box of await p.locator('#modal-form [type=checkbox]').all())await box.check();await submit();await click('review-pass');assert.match(await p.locator('#toast').innerText(),/不允许自审|业务负责人/);
 await p.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.role='业务负责人';state.user='演示复核员';save()});await p.reload();await click('review-pass');await p.locator('[name=reason]').fill('合成材料、推断和来源已核对');await submit();assert.equal((await snap()).reports[0].status,'已复核');await p.locator('[name=purpose]').fill('合成原型验收');await p.locator('#export-report-form [type=checkbox]').check();await p.locator('[name=format]').selectOption('JSON（含来源元信息）');const promise=p.waitForEvent('download');await p.locator('#export-report-form [type=submit]').click();const download=await promise;const data=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(data.graphSnapshot.nodes.length,11);assert.equal(data.caseSources.length,5);
});
await test('Permission boundary blocks detail contents',async()=>{
 for(const fields of [{permission:false},{permission:true,role:'平台管理员'},{role:'研判人员',org:'其他组织'}]){await p.evaluate(async fields=>{const {state,save}=await import('/src/state.js');Object.assign(state,fields);save()},fields);await p.reload();assert.equal(await p.locator('.cd-detail').count(),0);assert(!(await p.locator('#main').innerText()).includes('128,000'));}
});
await browser.close();await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));assert.deepEqual(errors,[]);assert.equal(results.filter(r=>r.status==='FAIL').length,0);console.log(`PASS ${results.length} case-detail acceptance groups`);
