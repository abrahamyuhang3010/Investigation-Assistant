import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {defaultGlobalScope,getSituationSnapshot,getRegion,getChildren,getRegionOptions} from '../src/global-situation-data.js';

let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const out=new URL('../../audit/map-first-2026-09-29/',import.meta.url);await fs.mkdir(out,{recursive:true});
const checks=[];const pass=name=>{checks.push(name);console.log('PASS',name)};
const countyCounts={
 '411302':15,'411303':19,'411321':21,'411322':19,'411323':19,'411324':22,'411325':16,
 '411326':17,'411327':16,'411328':23,'411329':15,'411330':16,'411381':29,
};
const overlayCounts={'411302':6,'411303':4,'411322':1};
const countyNames=Object.fromEntries(Object.keys(countyCounts).map(code=>[code,getRegion(code).name]));

// Data-model invariants: county fixtures remain canonical and every township/street receives a complete synthetic profile.
for(const timeRange of ['7D','30D','3M','6M','1Y'])for(const dataType of ['CASE','POLICE_ALERT']){
 const scope={...defaultGlobalScope(),timeRange,dataType},city=getSituationSnapshot(scope).view;
 assert.equal(city.regions.length,13);assert.equal(city.regions.reduce((sum,region)=>sum+region.count,0),city.total);
 assert.equal(city.victim.gender.reduce((sum,item)=>sum+item.value,0),city.victim.total);
 assert.equal(city.victim.age.reduce((sum,item)=>sum+item.value,0),city.victim.total);
 assert.equal(city.alerts.typeDistribution.reduce((sum,item)=>sum+item.value,0),city.total);
 assert.equal(city.alerts.addresses.reduce((sum,item)=>sum+item.value,0),city.total);
 for(const county of city.regions){
  const countyScope={...scope,regionId:county.id,regionName:county.name,regionLevel:'COUNTY'},snapshot=getSituationSnapshot(countyScope),view=snapshot.view;
  assert.equal(view.total,county.count);assert.ok(view.regions.every(region=>Number.isInteger(region.count)&&region.count>=0&&region.hasBusinessData===true&&region.businessDataMode==='synthetic'));
  assert.equal(view.regions.reduce((sum,region)=>sum+region.count,0),view.total);
  assert.equal(view.regions.length,county.id==='411322'?20:countyCounts[county.id]);
  const legalTownship=view.regions.find(region=>region.dataStatus!=='missing_geometry');
  const selected=getSituationSnapshot({...countyScope,selectedRegion:legalTownship.id});
  assert.equal(selected.view.total,view.total);assert.equal(selected.context.total,legalTownship.count);assert.equal(selected.context.hasBusinessData,true);
  assert.equal(selected.context.victim.gender.reduce((sum,item)=>sum+item.value,0),selected.context.victim.total);
  assert.equal(selected.context.victim.age.reduce((sum,item)=>sum+item.value,0),selected.context.victim.total);
  assert.equal(selected.context.alerts.typeDistribution.reduce((sum,item)=>sum+item.value,0),selected.context.total);
  assert.equal(selected.context.alerts.addresses.reduce((sum,item)=>sum+item.value,0),selected.context.total);
 }
}
assert.equal(Object.values(countyCounts).reduce((sum,count)=>sum+count,0),247);
assert.equal(getRegionOptions(defaultGlobalScope()).length,14);
const guanganRegion=getChildren('411322').find(region=>region.id==='411322004');
assert.equal(guanganRegion?.dataStatus,'missing_geometry');
const fangchengScope={...defaultGlobalScope(),regionId:'411322',regionName:'方城县',regionLevel:'COUNTY'};
const fangcheng=getSituationSnapshot(fangchengScope);
assert.equal(fangcheng.metrics.get('411322004')?.hasBusinessData,true);
const zone=getRegion('411371060'),zoneSnapshot=getSituationSnapshot({...defaultGlobalScope(),regionId:'411302',regionName:'宛城区',regionLevel:'COUNTY',selectedRegion:zone.id});
assert.equal(zone.isManagementZone,true);assert.equal(zoneSnapshot.context.hasBusinessData,true);assert.equal(zoneSnapshot.context.metric.businessDataMode,'synthetic-independent');
assert.equal(zoneSnapshot.view.regions.reduce((sum,region)=>sum+region.count,0),zoneSnapshot.view.total);
pass('data hierarchy: 13 counties, 247 polygon-backed townships, complete synthetic township metrics, and independent management-zone metrics');

const runtimeMapRoot=fileURLToPath(new URL('../assets/maps/nanyang/',import.meta.url));
await assert.rejects(fs.access(path.join(runtimeMapRoot,'all-townships.cleaned.geojson')));
const runtimeFiles=await fs.readdir(path.join(runtimeMapRoot,'townships'));
for(const file of runtimeFiles.filter(name=>name.endsWith('.geojson'))){const stat=await fs.stat(path.join(runtimeMapRoot,'townships',file));assert.ok(stat.size<1024*1024,`${file}: runtime GeoJSON exceeds 1 MiB (${stat.size})`)}
pass('runtime assets exclude the all-townships file and every lazy-loaded county payload stays below 1 MiB');

const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.addInitScript(()=>localStorage.clear());
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
page.on('request',request=>requests.push(new URL(request.url()).pathname));
const wait=ms=>page.waitForTimeout(ms||120);
const ready=(target=page)=>target.waitForSelector('[data-situation-map][data-map-status="ready"]');
const mapState=(target=page)=>target.evaluate(async()=>{
 const scope=structuredClone((await import('/src/state.js')).state.globalScope),stage=document.querySelector('[data-situation-map]'),chart=(await import('/src/situation-map.js')).getSituationMapChart();
 const series=chart?.getOption().series?.[0];
 return {scope,status:stage?.dataset.mapStatus,mapName:stage?.dataset.mapName,legal:Number(stage?.dataset.mapLegalFeatureCount),overlay:Number(stage?.dataset.mapOverlayFeatureCount),features:Number(stage?.dataset.mapFeatureCount),data:series?.data||[],tooltipConfined:chart?.getOption().tooltip?.[0]?.confine};
});
const selectScope=async(code,target=page)=>{await target.locator('[name="situation-region-select"]').selectOption(code);await target.waitForSelector(`[data-situation-map][data-map-name="nanyang-${code}"][data-map-status="ready"]`)};
const triggerMapEvent=async(type,id,target=page)=>target.evaluate(async({type,id})=>{
 const chart=(await import('/src/situation-map.js')).getSituationMapChart(),data=chart.getOption().series[0].data.find(item=>item.regionId===id);
 if(!data)throw new Error(`map region not found: ${id}`);
 chart.trigger(type,{componentType:'series',seriesType:'map',seriesIndex:0,name:data.name,data});
},{type,id});
const summaryCount=async(target=page)=>Number(await target.locator('[data-summary-count]').getAttribute('data-summary-count'));

try{
 await page.goto(base);await ready();
 let state=await mapState();
 assert.equal(new URL(page.url()).hash,'#/PG02');assert.equal(state.mapName,'nanyang-411300');assert.equal(state.legal,13);assert.equal(state.overlay,0);assert.equal(state.features,13);assert.equal(state.data.length,13);
 assert.equal(await page.locator('.region-row').count(),13);assert.equal(await page.locator('[name="situation-region-select"] option').count(),14);
 assert.equal(requests.filter(url=>url.includes('/townships/')).length,0);assert.equal(requests.filter(url=>url.includes('all-townships')).length,0);
 const cityLegend=await page.locator('.map-legend').boundingBox();assert.match(await page.locator('.map-legend').textContent(),/^案件数量/);assert.equal(await page.locator('.map-legend .legend-boundary').count(),0);
 pass('first screen loads 13 county polygons only and never requests township/all-townships data');

 // County double-click animates out/in, changes Global Scope, and does not leak the previous map.
 await triggerMapEvent('dblclick','411302');
 assert.equal(await page.locator('[data-map-drill-transition="out"]').count(),1);assert.match(await page.locator('.map-drill-cue').textContent(),/进入辖区.*宛城区/s);
 await page.waitForSelector('[data-map-name="nanyang-411302"][data-map-status="ready"][data-map-drill-transition="complete"]');state=await mapState();
 assert.equal(state.scope.regionId,'411302');assert.equal(state.legal,15);assert.equal(state.overlay,6);assert.equal(state.features,21);
 const countyLegend=await page.locator('.map-legend').boundingBox();assert.match(await page.locator('.map-legend').textContent(),/^案件数量/);assert.equal(await page.locator('.map-legend .legend-boundary').count(),0);assert.equal(countyLegend.height,cityLegend.height);
 await selectScope('411300');state=await mapState();assert.equal(state.features,13);assert.equal(state.data.length,13);
 await selectScope('411303');state=await mapState();assert.equal(state.scope.regionId,'411303');assert.equal(state.legal,19);assert.equal(state.overlay,4);assert.equal(state.features,23);assert.ok(state.data.every(item=>item.regionId.startsWith('411303')||item.isManagementZone));
 pass('city → Wancheng drill-down animates out/in; subsequent map switches have no feature leakage');

 // Every legal county file loads the expected polygon count; overlays exist only in the three display counties.
 for(const [code,count] of Object.entries(countyCounts)){
  await selectScope(code);state=await mapState();
  assert.equal(state.scope.regionId,code,`${code}: wrong scope`);assert.equal(state.mapName,`nanyang-${code}`);assert.equal(state.legal,count,`${code}: wrong legal polygon count`);assert.equal(state.overlay,overlayCounts[code]||0,`${code}: wrong overlay count`);assert.equal(state.features,count+(overlayCounts[code]||0));
 }
 pass('all 13 county maps load exact legal counts; clipped overlays are 6 / 4 / 1 and zero elsewhere');

 // Promise-level memory cache prevents a repeated county fetch.
 const before=requests.filter(url=>url.endsWith('/townships/411302.geojson')).length;
 await selectScope('411300');await selectScope('411302');await selectScope('411300');await selectScope('411302');
 const after=requests.filter(url=>url.endsWith('/townships/411302.geojson')).length;
 assert.equal(before,1);assert.equal(after,1);
 pass('same county is served from in-memory GeoJSON cache without refetch');

 // Township selection updates only Map Selection; left KPI and AI remain bound to the county scope.
 const countyTotal=await summaryCount(),insightBefore=await page.locator('[data-insight-count]').getAttribute('data-insight-count');
 await triggerMapEvent('click','411302001');await wait();state=await mapState();
 assert.equal(state.scope.regionId,'411302');assert.equal(state.scope.regionLevel,'COUNTY');assert.equal(state.scope.selectedRegion,'411302001');assert.equal(await summaryCount(),countyTotal);assert.equal(await page.locator('[data-insight-count]').getAttribute('data-insight-count'),insightBefore);
 const townshipInspector=await page.locator('.situation-right').textContent(),selectedTownshipCount=state.data.find(item=>item.regionId==='411302001').value;assert.match(townshipInspector,/分析面板/);assert.match(townshipInspector,/(受害人画像分析|警情结构分析)/);assert.equal(Number(await page.locator('[data-context-count]').getAttribute('data-context-count')),selectedTownshipCount);
 await triggerMapEvent('dblclick','411302001');await wait();assert.equal((await mapState()).scope.regionId,'411302');
 pass('township click selects only, preserves county KPI/AI scope, and township double-click does not drill');

 // Management overlay click is selection-only and explicitly excluded from legal-county statistics.
 await triggerMapEvent('click','411371060');await wait();state=await mapState();
 assert.equal(state.scope.regionId,'411302');assert.equal(state.scope.selectedRegion,'411371060');assert.equal(await summaryCount(),countyTotal);
 const inspector=await page.locator('.situation-right').textContent();assert.match(inspector,/功能区/);assert.match(inspector,/独立合成指标，不计入 13 个法定区县汇总/);
 await triggerMapEvent('dblclick','411371060');await wait();assert.equal((await mapState()).scope.regionId,'411302');
 pass('management-zone overlay is render-only selection and never changes Global Scope');

 // Missing Guang'an metadata is visible in the directory but absent from map data.
 await selectScope('411322');state=await mapState();assert.equal(state.legal,19);assert.equal(await page.locator('.region-row').count(),20);assert.equal(state.data.some(item=>item.regionId==='411322004'),false);
 const guangan=page.locator('.region-row[data-region-id="411322004"]');assert.match(await guangan.textContent(),/边界缺失（未绘制）/);await guangan.click();await wait();assert.equal((await mapState()).scope.regionId,'411322');
 assert.match(await guangan.textContent(),/合成数据/);assert.match(await page.locator('.situation-right').textContent(),/分析面板/);assert.equal(Number(await page.locator('[data-context-count]').getAttribute('data-context-count')),state.data.find(item=>item.regionId==='411322004')?.value||getSituationSnapshot({...fangchengScope,selectedRegion:'411322004'}).context.total);
 pass('411322004 Guang’an Street keeps synthetic business data while missing geometry is never drawn');

 // Responsive safe area, low heights, label collision control, tooltip confinement, light/dark.
 await selectScope('411302');
 for(const [width,height] of [[1440,768],[1440,900],[1600,900],[1920,1080]]){
  await page.setViewportSize({width,height});await wait(180);
  const layout=await page.evaluate(async()=>{
   const chart=(await import('/src/situation-map.js')).getSituationMapChart(),stage=document.querySelector('[data-situation-map]'),series=chart.getOption().series[0],safe=JSON.parse(stage.dataset.safeRect),rect=chart.getModel().getSeriesByIndex(0).coordinateSystem.getViewRect();
   return {safe,rect,scrollWidth:document.documentElement.scrollWidth,innerWidth,labelLayout:series.labelLayout,tooltip:chart.getOption().tooltip[0].confine};
  });
  assert.ok(layout.safe.width>300&&layout.safe.height>150);assert.ok(layout.rect.x>=layout.safe.x-2&&layout.rect.y>=layout.safe.y-2);assert.ok(layout.rect.x+layout.rect.width<=layout.safe.x+layout.safe.width+2);assert.ok(layout.rect.y+layout.rect.height<=layout.safe.y+layout.safe.height+2);assert.ok(layout.scrollWidth<=layout.innerWidth);assert.equal(layout.labelLayout.hideOverlap,true);assert.equal(layout.tooltip,true);
 }
 const initialTheme=await page.locator('html').getAttribute('data-theme');await page.locator('[data-action="theme"]').first().click();await ready();assert.notEqual(await page.locator('html').getAttribute('data-theme'),initialTheme);
 await page.screenshot({path:fileURLToPath(new URL('township-map-dark.png',out))});
 pass('responsive safe area at 1440/1600/1920 and low height; label overlap control, confined tooltip, dark theme');

 // Selection and hover linkage remain available through ECharts and the region directory.
 await triggerMapEvent('click','411302001');await wait();
 assert.equal(await page.locator('.region-row[data-region-id="411302001"].selected').count(),1);
 const selected=await page.evaluate(async()=>{const chart=(await import('/src/situation-map.js')).getSituationMapChart(),series=chart.getModel().getSeriesByIndex(0),index=series.getData().indexOfName('东关街道');return series.isSelected(index)});
 assert.equal(selected,true);
 const mapOption=await mapState();assert.equal(mapOption.tooltipConfined,true);
 pass('township selection is synchronized between map and directory; tooltip is confined');

 assert.deepEqual(errors,[]);pass('successful path has no console errors or uncaught exceptions');

 // Reduced-motion users drill immediately without the outgoing animation delay.
 const reducedContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const reduced=await reducedContext.newPage();await reduced.addInitScript(()=>localStorage.clear());await reduced.goto(base);await ready(reduced);
 await triggerMapEvent('dblclick','411302',reduced);
 const reducedScope=await reduced.evaluate(async()=>(await import('/src/state.js')).state.globalScope.regionId);
 assert.equal(reducedScope,'411302');assert.equal(await reduced.locator('.is-drilling-out').count(),0);
 await reduced.waitForSelector('[data-map-name="nanyang-411302"][data-map-status="ready"]');await reducedContext.close();
 pass('prefers-reduced-motion skips the drill-out delay and still enters the county map');

 // Rapid scope changes: delayed old requests must not overwrite the last selection.
 const rapid=await context.newPage();await rapid.addInitScript(()=>localStorage.clear());
 const delays={'411302':320,'411303':190,'411381':20};
 for(const [code,delay] of Object.entries(delays))await rapid.route(`**/assets/maps/nanyang/townships/${code}.geojson`,async route=>{await new Promise(resolve=>setTimeout(resolve,delay));await route.continue()});
 await rapid.goto(base);await ready(rapid);
 for(const code of ['411302','411303','411381'])await rapid.locator('[name="situation-region-select"]').selectOption(code);
 await rapid.waitForSelector('[data-map-name="nanyang-411381"][data-map-status="ready"]');await rapid.waitForTimeout(380);
 const rapidState=await rapid.evaluate(async()=>({scope:(await import('/src/state.js')).state.globalScope.regionId,mapName:document.querySelector('[data-situation-map]').dataset.mapName,legal:document.querySelector('[data-situation-map]').dataset.mapLegalFeatureCount}));
 assert.deepEqual(rapidState,{scope:'411381',mapName:'nanyang-411381',legal:'29'});await rapid.close();
 pass('rapid Wancheng → Wolong → Dengzhou switching ends on Dengzhou without stale async overwrite');

 // County fetch failure has an honest error state and retry clears cache before re-fetching.
 const failure=await context.newPage();await failure.addInitScript(()=>localStorage.clear());let attempts=0;
 await failure.route('**/assets/maps/nanyang/townships/411302.geojson',async route=>{attempts++;if(attempts===1)await route.fulfill({status:503,body:'unavailable'});else await route.continue()});
 await failure.goto(base);await ready(failure);await failure.locator('[name="situation-region-select"]').selectOption('411302');await failure.waitForSelector('[data-map-status="error"]');
 assert.match(await failure.locator('.map-load-state').textContent(),/真实行政区地图加载失败/);await failure.locator('[data-action="situation-map-retry"]').click();await failure.waitForSelector('[data-map-name="nanyang-411302"][data-map-status="ready"]');assert.equal(attempts,2);await failure.close();
 pass('county fetch failure shows no fake fallback and retry recovers with a fresh request');

 // Existing but empty county file produces a distinct Empty state; retry is offered.
 const empty=await context.newPage();await empty.addInitScript(()=>localStorage.clear());
 await empty.route('**/assets/maps/nanyang/townships/411303.geojson',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({type:'FeatureCollection',features:[]})}));
 await empty.goto(base);await ready(empty);await empty.locator('[name="situation-region-select"]').selectOption('411303');await empty.waitForSelector('[data-map-status="empty"]');assert.match(await empty.locator('.map-load-state').textContent(),/暂无乡级边界数据/);assert.equal(await empty.locator('[data-action="situation-map-retry"]').count(),1);await empty.close();
 pass('empty county FeatureCollection renders explicit Empty state');

 // Incomplete city data is rejected rather than rendered as a misleading map.
 const invalid=await context.newPage();await invalid.addInitScript(()=>localStorage.clear());
 await invalid.route('**/assets/maps/nanyang/city/411300.geojson',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({type:'FeatureCollection',features:[]})}));
 await invalid.goto(base);await invalid.waitForSelector('[data-map-status="error"]');assert.match(await invalid.locator('.map-load-state').textContent(),/13个唯一行政代码/);await invalid.close();
 pass('incomplete city GeoJSON is rejected');

 await fs.writeFile(new URL('results.json',out),JSON.stringify({date:'2026-09-29',checks,errors},null,2));
 console.log(`global-situation PASS (${checks.length} groups)`);
}finally{
 await context.close();await browser.close();
}
