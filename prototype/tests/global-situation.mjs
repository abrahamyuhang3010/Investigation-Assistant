import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {defaultGlobalScope,getSituationSnapshot} from '../src/global-situation-data.js';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const out=new URL('../../audit/map-first-2026-09-22/',import.meta.url);await fs.mkdir(out,{recursive:true});
const checks=[];const pass=name=>{checks.push(name);console.log('PASS',name)};
// Canonical metric unit invariants across filters, levels and selection.
for(const timeRange of ['7D','30D','3M','6M','1Y'])for(const dataType of ['CASE','POLICE_ALERT']){
 const scope={...defaultGlobalScope(),timeRange,dataType};
 const snap=getSituationSnapshot(scope),{view}=snap;
 assert.equal(view.regions.reduce((n,r)=>n+r.count,0),view.total);
 assert.equal(view.victim.gender.reduce((n,r)=>n+r.value,0),view.victim.total);
 assert.equal(view.victim.age.reduce((n,r)=>n+r.value,0),view.victim.total);
 assert.equal(view.alerts.typeDistribution.reduce((n,r)=>n+r.value,0),view.total);
 for(const address of view.alerts.addresses)assert.equal(address.value,view.regions.find(r=>r.name===address.label).count);
 if(dataType==='CASE')for(const method of view.victim.methods)assert.equal(method.value,getSituationSnapshot({...scope,crimeMethod:method.id}).view.total);
 for(const region of view.regions){
  const child=getSituationSnapshot({...scope,regionId:region.id,regionName:region.name,regionLevel:'COUNTY'}).view;
  assert.equal(child.total,region.count);assert.equal(child.regions.reduce((n,r)=>n+r.count,0),child.total);
  if(region.allowed){const selected=getSituationSnapshot({...scope,selectedRegion:region.id});assert.equal(selected.context.total,region.count);assert.equal(selected.view.total,view.total)}
 }
}
pass('10 scope combinations: parent/child totals, profile sums, selection equality');
for(const dataType of ['CASE','POLICE_ALERT']){
 const baseline={...defaultGlobalScope(),dataType};
 const inactive={...baseline,customStart:'2025-01-01',customEnd:'2025-02-02',...(dataType==='CASE'?{alertCategory:'THEFT'}:{caseCategory:'TELECOM',caseSubCategory:'REBATE',crimeMethod:'REBATE'})};
 assert.deepEqual(getSituationSnapshot(inactive).view.regions,getSituationSnapshot(baseline).view.regions);
}
pass('inactive custom dates and inactive-mode filters do not change metrics');
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const wait=()=>page.waitForTimeout(180);
const ready=()=>page.waitForSelector('[data-situation-map][data-map-status="ready"]');
const scope=()=>page.evaluate(async()=>structuredClone((await import('/src/state.js')).state.globalScope));
const ui=()=>page.evaluate(async()=>structuredClone((await import('/src/state.js')).state.situationUI));
const total=async()=>Number(await page.locator('[data-summary-count]').getAttribute('data-summary-count'));
const action=async(name,extra='')=>{await page.locator(`[data-action="${name}"]${extra}`).first().click();await wait()};
const chartInfo=()=>page.evaluate(async()=>{const c=(await import('/src/situation-map.js')).getSituationMapChart();const s=c.getOption().series[0];return {zoom:s.zoom,center:s.center,data:s.data,rect:c.getModel().getSeriesByIndex(0).coordinateSystem.getViewRect(),safe:JSON.parse(document.querySelector('[data-situation-map]').dataset.safeRect)}});
async function mapPoint(id){return page.evaluate(async id=>{const c=(await import('/src/situation-map.js')).getSituationMapChart();const data=c.getOption().series[0].data.find(d=>d.regionId===id);const g=c.getModel().getSeriesByIndex(0).coordinateSystem;const point=c.convertToPixel({seriesIndex:0},g.getRegion(data.name).getCenter());const box=c.getDom().getBoundingClientRect();return {x:point[0]+box.left,y:point[1]+box.top}},id)}
async function consistent(id){
 const data=await page.evaluate(async id=>{const s=(await import('/src/state.js')).state.globalScope;const snapshot=(await import('/src/global-situation-data.js')).getSituationSnapshot(s);const c=(await import('/src/situation-map.js')).getSituationMapChart();return {metric:snapshot.metrics.get(id).count,map:c.getOption().series[0].data.find(d=>d.regionId===id).value}},id);
 assert.equal(data.metric,data.map);assert.equal(Number(await page.locator('[data-context-count]').getAttribute('data-context-count')),data.metric);assert.equal(Number(await page.locator('[data-insight-count]').getAttribute('data-insight-count')),data.metric);
 const row=await page.locator(`.region-row[data-region-id="${id}"] .region-count`).textContent();assert.equal(Number(row.replace(/[^\d]/g,'')),data.metric);
}
try{
 await page.goto(base);await ready();await wait();assert.equal(new URL(page.url()).hash,'#/PG02');assert.equal(await page.locator('.global-nav a.active').textContent(),'全域态势');assert(await page.locator('[data-action="situation-enter"]').isDisabled());
 assert.equal((await chartInfo()).data.length,13);assert.equal(await page.locator('.region-row').count(),13);assert.equal(await page.locator('.situation-map-card,.situation-workspace').count(),0);pass('root/default route, navigation, map canvas and 13 real counties');
 const cityTotal=await total();await action('situation-select','[data-region-id="411302"]');assert.equal((await scope()).regionId,'411300');assert.equal((await scope()).selectedRegion,'411302');assert.equal(await total(),cityTotal);await consistent('411302');pass('single list click selects without drilling; all five surfaces share exact count');
 // Hover in both directions using real pointer events.
 await page.locator('.region-row[data-region-id="411302"]').hover();await wait();assert(await page.locator('.situation-tooltip').isVisible());assert((await page.locator('.situation-tooltip').textContent()).includes('宛城区'));
 const wolong=await mapPoint('411303');await page.mouse.move(wolong.x,wolong.y);await wait();assert((await page.locator('.region-row[data-region-id="411303"]').getAttribute('class')).includes('hovered'));pass('bidirectional map/list hover and tokenized tooltip');
 await page.mouse.click(wolong.x,wolong.y);await wait();assert.equal((await scope()).regionId,'411300');assert.equal((await scope()).selectedRegion,'411303');await consistent('411303');assert.equal(await page.locator('.module-error').count(),1);await action('situation-occupation-retry');assert.equal(await page.locator('.module-error').count(),0);pass('real map click updates Inspector/AI, module failure and retry are isolated');
 // Real double click must survive the first click selecting and rerendering overlays.
 const wancheng=await mapPoint('411302');await page.mouse.dblclick(wancheng.x,wancheng.y,{delay:90});await page.waitForSelector('[data-map-status="unavailable"]');assert.equal((await scope()).regionId,'411302');assert.equal((await scope()).selectedRegion,null);assert((await page.locator('.map-load-state').textContent()).includes('下级行政区数据待接入'));assert.equal(await page.locator('canvas').count(),0);pass('double click drills to county; no fabricated street map fallback');
 await action('situation-map-reset');await ready();assert.equal((await scope()).regionId,'411300');assert.equal((await scope()).selectedRegion,null);
 await action('situation-select','[data-region-id="411330"]');assert.equal((await scope()).selectedRegion,null);assert((await page.locator('#toast').textContent()).includes('暂无该辖区数据访问权限'));assert(await page.locator('[data-action="situation-enter"]').isDisabled());
 const denied=await mapPoint('411330');await page.mouse.click(denied.x,denied.y);await wait();assert.equal((await scope()).selectedRegion,null);assert.equal((await scope()).regionId,'411300');assert.equal(await page.evaluate(async()=>{const c=(await import('/src/situation-map.js')).getSituationMapChart();return c.getModel().getSeriesByIndex(0).getSelectedDataIndices().length}),0);
 await action('situation-select','[data-region-id="411302"]');await action('situation-enter');assert.equal((await scope()).regionId,'411302');await action('situation-region','[data-region-id="411300"]');await ready();pass('permission rejection, explicit drill button, breadcrumb and reset');
 await action('situation-select','[data-region-id="411302"]');const before=Number(await page.locator('[data-context-count]').getAttribute('data-context-count'));
 await page.locator('[name="situation-time"]').selectOption('7D');await ready();await consistent('411302');assert.notEqual(Number(await page.locator('[data-context-count]').getAttribute('data-context-count')),before);
 await action('situation-category','[data-category-id="TELECOM"]');await ready();await consistent('411302');assert.equal((await scope()).caseCategory,'TELECOM');
 await page.locator('[name="situation-case-subcategory"]').selectOption('REBATE');await ready();await consistent('411302');assert.equal((await scope()).caseSubCategory,'REBATE');
 await action('situation-method','[data-method-id="INVESTMENT"]');await ready();await consistent('411302');assert.equal((await scope()).crimeMethod,'INVESTMENT');assert.equal((await scope()).caseSubCategory,'ALL');
 pass('time/category/subcategory/method refresh spatial metrics, banner and profile together');
 await action('situation-collapse','[data-panel="insight"]');assert((await ui()).insightCollapsed);
 await page.locator('[name="situation-time"]').selectOption('30D');await ready();assert.equal(await page.locator('.situation-banner p').count(),0);
 await action('situation-mode','[data-mode="POLICE_ALERT"]');await ready();assert((await ui()).insightCollapsed);assert.equal((await scope()).crimeMethod,'ALL');assert((await page.locator('.inspector-scroll').textContent()).includes('警情结构分析'));assert.equal(await page.locator('.victim-total').count(),0);
 await action('situation-collapse','[data-panel="insight"]');await consistent('411302');pass('police semantics and AI collapsed-state persistence across filters');
 // Preserve business scope while visual controls and overlay reflow change.
 const previousScope=await scope();const oldSafe=(await chartInfo()).safe;
 await action('situation-collapse','[data-panel="left"]');await action('situation-collapse','[data-panel="right"]');const afterSafe=(await chartInfo()).safe;assert(afterSafe.width>oldSafe.width);assert.deepEqual(await scope(),previousScope);
 await action('situation-map-zoom','[data-delta="0.18"]');assert((await chartInfo()).zoom>1);assert.equal((await scope()).regionId,previousScope.regionId);
 const drag=await mapPoint('411302');await page.mouse.move(drag.x,drag.y);await page.mouse.down();await page.mouse.move(drag.x+38,drag.y+20,{steps:8});await page.mouse.up();await wait();assert(Array.isArray((await scope()).mapCenter));assert.equal((await scope()).selectedRegion,previousScope.selectedRegion);
 await action('situation-layers');assert.equal(await page.locator('.layer-popover input:disabled').count(),2);await page.locator('[name="situation-heat"]').uncheck();await wait();assert.equal((await ui()).heat,false);assert.equal((await scope()).regionId,previousScope.regionId);await page.keyboard.press('Escape');assert.equal(await page.locator('.layer-popover').count(),0);
 pass('collapse safe-area reflow, zoom/pan separate from scope, honest layers popover');
 await action('situation-collapse','[data-panel="left"]');await action('situation-collapse','[data-panel="right"]');await action('situation-map-reset');await ready();assert.equal((await scope()).selectedRegion,null);assert.equal((await scope()).mapZoom,1);assert.equal((await scope()).mapCenter,null);
 await action('situation-mode','[data-mode="CASE"]');await ready();await page.locator('[name="situation-time"]').selectOption('CUSTOM');await ready();const customTotal=await total();await page.locator('[name="situation-custom-start"]').fill('2026-09-01');await page.locator('[name="situation-custom-start"]').blur();await ready();assert.notEqual(await total(),customTotal);pass('custom date range recomputes all metrics');
 for(const state of ['加载中','空状态','加载失败','无权限','数据过期','部分数据']){await page.locator('#view-state').selectOption(state);await wait();if(state==='加载中')assert.equal(await page.locator('.situation-state-skeleton').count(),1);else if(state==='部分数据')assert.equal(await page.locator('.module-error').count(),1);else assert.equal(await page.locator('.situation-state').count(),1)}
 await page.locator('#view-state').selectOption('正常');await ready();pass('loading, empty, error, permission, stale and partial state UI');
 await page.locator('.global-nav a',{hasText:'超级搜索'}).click();await wait();assert.equal(await page.locator('.global-nav a.active').textContent(),'超级搜索');await page.locator('.global-nav a',{hasText:'全域态势'}).click();await ready();const saved=await scope();await page.reload();await ready();assert.deepEqual(await scope(),saved);pass('search navigation, return and browser-refresh persistence');
 // Restore baseline before visual acceptance captures.
 await page.locator('[name="situation-time"]').selectOption('3M');await ready();await action('situation-layers');await page.locator('[name="situation-heat"]').check();await page.keyboard.press('Escape');await wait();
 await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));await page.mouse.move(720,70);await page.evaluate(()=>document.activeElement?.blur());
 for(const [width,height] of [[1440,900],[1600,1000],[1920,1080]]){
  await page.setViewportSize({width,height});await wait();const info=await chartInfo();
  assert(info.safe.width>650);assert(info.rect.x>=info.safe.x-1&&info.rect.y>=info.safe.y-1);assert(info.rect.x+info.rect.width<=info.safe.x+info.safe.width+1);assert(info.rect.y+info.rect.height<=info.safe.y+info.safe.height+1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(await page.evaluate(()=>document.querySelector('.situation-echarts').getBoundingClientRect().width===innerWidth));
  await page.screenshot({path:fileURLToPath(new URL(`map-first-${width}.png`,out))});
 }
 pass('1440/1600/1920: full canvas, map inside measured safe area, no horizontal overflow');
 await action('theme');await ready();await page.screenshot({path:fileURLToPath(new URL('map-first-dark.png',out))});assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.setViewportSize({width:1024,height:768});await wait();assert((await ui()).rightCollapsed);await page.screenshot({path:fileURLToPath(new URL('map-first-1024.png',out))});
 await page.setViewportSize({width:760,height:800});await wait();assert((await ui()).leftCollapsed);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await action('situation-collapse','[data-panel="right"]');assert((await ui()).leftCollapsed);await page.screenshot({path:fileURLToPath(new URL('map-first-760.png',out))});
 pass('dark theme and narrow-desktop drawers');assert.deepEqual(errors,[]);pass('no console errors or uncaught exceptions on successful path');
 // Independent failure tests: keep expected network errors out of successful-path assertions.
 const fail=await browser.newPage();await fail.route('**/assets/maps/411300.json',r=>r.fulfill({status:503,body:'unavailable'}));await fail.goto(base);await fail.waitForSelector('[data-map-status="error"]');assert((await fail.locator('.map-load-state').textContent()).includes('重新加载'));await fail.unroute('**/assets/maps/411300.json');await fail.locator('[data-action="situation-map-retry"]').click();await fail.waitForSelector('[data-map-status="ready"]');await fail.close();pass('map fetch failure and retry recovery');
 const invalid=await browser.newPage();await invalid.route('**/assets/maps/411300.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({type:'FeatureCollection',features:[]})}));await invalid.goto(base);await invalid.waitForSelector('[data-map-status="error"]');await invalid.close();pass('malformed / incomplete GeoJSON rejected');
 await fs.writeFile(new URL('results.json',out),JSON.stringify({date:'2026-09-22',checks,errors},null,2));console.log(`global-situation PASS (${checks.length} groups)`);
}finally{await browser.close()}
