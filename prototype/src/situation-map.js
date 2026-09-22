import {getSituationSnapshot} from './global-situation-data.js';
import {MapTooltip} from './global-situation-panels.js';
import {legendSteps,situationUI} from './global-situation.js';
import {esc,btn} from './ui.js';
import {state} from './state.js';

const MAP_NAME='nanyang-411300';
const EXPECTED=['411302','411303','411321','411322','411323','411324','411325','411326','411327','411328','411329','411330','411381'];
const sources={'411300':new URL('../assets/maps/411300.json',import.meta.url)};
const geoCache=new Map();
let chart=null,resizeObserver=null,mutationObserver=null,generation=0,frame=0,persistTimer=null;
let currentScope=null,currentSnapshot=null,stage=null,indexByRegion=new Map(),palette=null;

/** Extensible boundary provider: no artificial geometry when a child map is unavailable. */
export async function loadRegionGeoJSON(adcode){
 if(!sources[adcode])return null;
 if(!geoCache.has(adcode))geoCache.set(adcode,fetch(sources[adcode],{cache:'force-cache'}).then(response=>{
  if(!response.ok)throw Error(`GeoJSON 加载失败（${response.status}）`);return response.json();
 }).then(geo=>{
  const codes=geo.features?.map(f=>String(f.properties?.adcode))||[];
  if(geo.type!=='FeatureCollection'||codes.length!==13||new Set(codes).size!==13||EXPECTED.some(code=>!codes.includes(code)))throw Error('南阳市行政区数据校验失败：需要13个唯一行政代码');
  for(const f of geo.features){
   if(!['Polygon','MultiPolygon'].includes(f.geometry?.type)||!f.geometry.coordinates?.length)throw Error('行政区几何无效');
   const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
   if(polygons.some(p=>!p.length||p.some(r=>r.length<4||r.some(point=>point.length<2||!point.slice(0,2).every(Number.isFinite)))))throw Error('行政区坐标无效');
  }
  return geo;
 }).catch(error=>{geoCache.delete(adcode);throw error}));
 return geoCache.get(adcode);
}
function status(kind,html=''){
 if(!stage)return;stage.dataset.mapStatus=kind;
 const node=stage.querySelector('[data-map-status]');if(node){node.hidden=kind==='ready';node.innerHTML=html}
}
function readTokens(){
 const page=document.querySelector('.situation-page'),style=getComputedStyle(page);
 const swatch=document.createElement('span');page.append(swatch);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 function color(token){
  swatch.style.color=`var(${token})`;ctx.clearRect(0,0,1,1);ctx.fillStyle=getComputedStyle(swatch).color;ctx.fillRect(0,0,1,1);
  const [r,g,b]=ctx.getImageData(0,0,1,1).data;return `rgb(${r},${g},${b})`;
 }
 const result={text:color('--text'),muted:color('--muted'),border:color('--border'),surface:color('--surface'),brand:color('--brand'),soft:color('--brand-soft'),font:style.fontFamily,heat:Array.from({length:5},(_,i)=>color(`--heat-${i}`))};
 swatch.remove();return result;
}
function mapData(geo){
 indexByRegion=new Map();
 return geo.features.map((feature,i)=>{
  const id=String(feature.properties.adcode),metric=currentSnapshot.metrics.get(id);indexByRegion.set(id,i);
  return {name:feature.properties.name,adcode:id,regionId:id,value:metric?.count??null,selected:currentScope.selectedRegion===id};
 });
}
function optionFor(geo){
 const max=Math.max(...currentSnapshot.view.regions.map(r=>r.count),1),steps=legendSteps(max),ui=situationUI();
 return {
  animation:false,aria:{enabled:true,label:{enabled:true,description:'南阳市13区县案件或警情分布；可使用左侧区域列表键盘选中，并用进入辖区按钮下钻。'}},
  tooltip:{trigger:'item',confine:true,enterable:false,backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1,padding:12,
   textStyle:{color:palette.text,fontSize:12,fontFamily:palette.font},extraCssText:'border-radius:8px;',
   formatter:p=>MapTooltip(currentSnapshot.metrics.get(p.data?.regionId),currentScope)},
  visualMap:{type:'piecewise',show:false,seriesIndex:0,selectedMode:false,pieces:steps.map((s,i)=>({gte:s.min,lte:s.max,color:ui.heat?palette.heat[i]:palette.soft}))},
  series:[{id:'nanyang-map',type:'map',map:MAP_NAME,nameProperty:'name',roam:true,scaleLimit:{min:.82,max:2.8},
   zoom:currentScope.mapZoom||1,center:currentScope.mapCenter||null,selectedMode:'single',data:mapData(geo),
   itemStyle:{areaColor:palette.soft,borderColor:palette.surface,borderWidth:1.5},
   select:{itemStyle:{borderColor:palette.brand,borderWidth:3},label:{fontWeight:700,color:palette.text}},
   emphasis:{itemStyle:{borderColor:palette.brand,borderWidth:2},label:{color:palette.text,fontWeight:700}},
   label:{show:true,color:palette.text,fontFamily:palette.font,fontSize:12,lineHeight:18,
    textBorderColor:palette.surface,textBorderWidth:2,formatter:p=>`${p.name}\n${p.data?.value??'—'}`},
   labelLayout:{hideOverlap:true},
  }],
 };
}
function highlightRow(id,active){document.querySelectorAll(`.region-row[data-region-id="${CSS.escape(id)}"]`).forEach(n=>n.classList.toggle('hovered',active))}

/** Map fit uses live overlay bounds, never a hardcoded three-column offset. */
export function reflowSituationMap(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  const page=document.querySelector('.situation-page');if(!page)return;
  const bounds=page.getBoundingClientRect(),gap=parseFloat(getComputedStyle(page).getPropertyValue('--s4'))||16;
  const rect=selector=>{const el=page.querySelector(selector);return el?.getClientRects().length?el.getBoundingClientRect():null};
  const left=rect('[data-safe-left]'),right=rect('[data-safe-right]'),tops=[...page.querySelectorAll('[data-safe-top]')].map(el=>el.getBoundingClientRect());
  let x=left?left.right-bounds.left+gap:gap,endX=right?right.left-bounds.left-gap:bounds.width-gap;
  const y=Math.max(gap,...tops.map(r=>r.bottom-bounds.top+gap));
  page.style.setProperty('--inspector-top',`${y}px`);
  const controls=rect('.map-controls'),legend=rect('.map-legend');
  if(controls&&controls.left-bounds.left>x+240)endX=Math.min(endX,controls.left-bounds.left-gap);
  let bottom=bounds.height-gap;
  if(legend&&legend.right-bounds.left>x)bottom=Math.min(bottom,legend.top-bounds.top-gap);
  // Narrow desktop uses drawers. Avoid a zero-width map while a drawer is open.
  if(endX-x<240){x=gap;endX=bounds.width-gap}
  const safe={x,y,width:Math.max(160,endX-x),height:Math.max(160,bottom-y)};
  if(stage)stage.dataset.safeRect=JSON.stringify(safe);
  const layer=page.querySelector('.map-status-layer');
  if(layer)Object.assign(layer.style,{left:`${safe.x}px`,top:`${safe.y}px`,width:`${safe.width}px`,height:`${safe.height}px`,right:'auto',bottom:'auto'});
  if(chart&&!chart.isDisposed()){
   if(chart.getWidth()!==bounds.width||chart.getHeight()!==bounds.height)chart.resize();
   const geoBounds=chart.getModel().getSeriesByIndex(0).coordinateSystem.getBoundingRect();
   const aspect=geoBounds.width/geoBounds.height*.75;
   chart.setOption({series:[{id:'nanyang-map',layoutCenter:[safe.x+safe.width/2,safe.y+safe.height/2],layoutSize:Math.min(safe.width,safe.height*aspect)}]});
  }
 });
}
function observe(){
 const page=document.querySelector('.situation-page');if(!page)return;
 const watch=()=>{resizeObserver?.disconnect();resizeObserver=new ResizeObserver(reflowSituationMap);resizeObserver.observe(page);page.querySelectorAll('[data-safe-top],[data-safe-left],[data-safe-right],[data-safe-bottom]').forEach(el=>resizeObserver.observe(el));reflowSituationMap()};
 mutationObserver=new MutationObserver(watch);mutationObserver.observe(page.querySelector('[data-situation-overlays]'),{childList:true,subtree:true});watch();
}
export function disposeSituationMap(){
 generation++;cancelAnimationFrame(frame);clearTimeout(persistTimer);resizeObserver?.disconnect();mutationObserver?.disconnect();resizeObserver=mutationObserver=null;
 if(chart&&!chart.isDisposed())chart.dispose();chart=null;stage=null;indexByRegion.clear();
}
export async function mountSituationMap({scope,onRegionSelect,onRegionDrill,onPersist}={}){
 disposeSituationMap();stage=document.querySelector('[data-situation-map]');if(!stage)return;
 currentScope=scope;currentSnapshot=getSituationSnapshot(scope);const run=generation;observe();
 if(!['正常','部分数据'].includes(state.viewState)){status('inactive');return}
 if(!sources[scope.regionId]){
  status('unavailable',`<div class="map-load-state"><strong>下级行政区数据待接入</strong><span>${esc(scope.regionName)}的真实乡镇 / 街道边界尚未接入。不会以示意几何代替。</span>${btn('返回南阳市','situation-region','data-region-id="411300"','secondary')}</div>`);return;
 }
 status('loading','<div class="map-load-state" role="status"><span class="map-loading-skeleton"></span><strong>正在加载真实行政区地图</strong><span>本地南阳市 GeoJSON · 13 个区县</span></div>');
 try{
  if(!window.echarts)throw Error('ECharts 运行库未加载');
  const geo=await loadRegionGeoJSON(scope.regionId);if(run!==generation)return;
  window.echarts.registerMap(MAP_NAME,geo);palette=readTokens();chart=window.echarts.init(stage.querySelector('[data-situation-map-chart]'),null,{renderer:'canvas'});
  chart.setOption(optionFor(geo));stage.dataset.mapFeatureCount=String(geo.features.length);stage.dataset.mapSource='local-geojson';status('ready');reflowSituationMap();
  chart.on('mouseover',p=>{if(p.data?.regionId)highlightRow(p.data.regionId,true)});
  chart.on('mouseout',p=>{if(p.data?.regionId)highlightRow(p.data.regionId,false)});
  chart.on('click',p=>{if(p.data?.regionId)onRegionSelect?.(p.data.regionId)});
  chart.on('dblclick',p=>{if(p.data?.regionId)onRegionDrill?.(p.data.regionId)});
  chart.on('georoam',()=>{
   const s=chart.getOption().series[0];scope.mapZoom=s.zoom||1;scope.mapCenter=Array.isArray(s.center)?s.center:null;
   clearTimeout(persistTimer);persistTimer=setTimeout(()=>onPersist?.(),180);
  });
 }catch(error){if(run===generation)status('error',`<div class="map-load-state" role="alert"><strong>真实行政区地图加载失败</strong><span>${esc(error.message)}</span>${btn('重新加载','situation-map-retry','','secondary')}</div>`)}
}
export function updateSituationMap(){
 if(!chart||chart.isDisposed()){reflowSituationMap();return}
 currentSnapshot=getSituationSnapshot(currentScope);
 const max=Math.max(...currentSnapshot.view.regions.map(r=>r.count),1);
 chart.setOption({visualMap:{pieces:legendSteps(max).map((s,i)=>({gte:s.min,lte:s.max,color:situationUI().heat?palette.heat[i]:palette.soft}))},series:[{id:'nanyang-map',zoom:currentScope.mapZoom,center:currentScope.mapCenter||null}]});
 chart.dispatchAction({type:'unselect',seriesIndex:0,dataIndex:[...indexByRegion.values()]});
 const index=indexByRegion.get(currentScope.selectedRegion);if(index!==undefined)chart.dispatchAction({type:'select',seriesIndex:0,dataIndex:index});
 reflowSituationMap();
}
export function setSituationMapRegionHover(id,active){
 if(!chart||chart.isDisposed())return;const dataIndex=indexByRegion.get(String(id));if(dataIndex===undefined)return;
 chart.dispatchAction({type:active?'highlight':'downplay',seriesIndex:0,dataIndex});chart.dispatchAction({type:active?'showTip':'hideTip',seriesIndex:0,dataIndex});
}
export function getSituationMapChart(){return chart}
