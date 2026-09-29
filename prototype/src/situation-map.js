import {getSituationSnapshot,getRegion} from './global-situation-data.js';
import {MapTooltip} from './global-situation-panels.js';
import {legendSteps,situationUI} from './global-situation.js';
import {esc,btn} from './ui.js';
import {state} from './state.js';
import {loadRegionMap,clearRegionMapCache} from './region-map-loader.js';

let chart=null,resizeObserver=null,mutationObserver=null,generation=0,frame=0,persistTimer=null,drillTimer=null;
let currentScope=null,currentSnapshot=null,stage=null,indexByRegion=new Map(),palette=null,currentMap=null,pendingDrillEntry=null;

export async function loadRegionGeoJSON(regionCode){const result=await loadRegionMap(regionCode);return result?.geo||null}
export function clearSituationMapCache(regionCode){clearRegionMapCache(regionCode)}

function prefersReducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches}
function drillIntoRegion(id,onRegionDrill){
 const target=getRegion(id);if(!target||target.id!==id||stage?.classList.contains('is-drilling-out'))return;
 pendingDrillEntry={id,name:target.name};
 if(prefersReducedMotion()){onRegionDrill?.(id);return}
 stage.classList.add('is-drilling-out');stage.dataset.mapDrillTransition='out';
 const cue=document.createElement('div');cue.className='map-drill-cue';cue.setAttribute('aria-hidden','true');cue.innerHTML=`<span>进入辖区</span><strong>${esc(target.name)}</strong>`;stage.append(cue);
 clearTimeout(drillTimer);drillTimer=setTimeout(()=>{drillTimer=null;onRegionDrill?.(id)},190);
}
function status(kind,html=''){
 if(!stage)return;stage.dataset.mapStatus=kind;
 const node=stage.querySelector('[data-map-status]');if(node){node.hidden=kind==='ready';node.innerHTML=html}
}
function readTokens(){
 const page=document.querySelector('.situation-page'),style=getComputedStyle(page);const swatch=document.createElement('span');page.append(swatch);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 const color=token=>{swatch.style.color=`var(${token})`;ctx.clearRect(0,0,1,1);ctx.fillStyle=getComputedStyle(swatch).color;ctx.fillRect(0,0,1,1);const [r,g,b]=ctx.getImageData(0,0,1,1).data;return `rgb(${r},${g},${b})`};
 const result={text:color('--text'),muted:color('--muted'),border:color('--border'),surface:color('--surface'),brand:color('--brand'),soft:color('--brand-soft'),font:style.fontFamily,heat:Array.from({length:5},(_,i)=>color(`--heat-${i}`))};swatch.remove();return result;
}
function featureMetric(feature){
 const p=feature.properties||{},id=String(p.regionCode||p.adcode||'');
 const metric=currentSnapshot.metrics.get(id)||getRegion(id);
 return {...metric,name:p.name||metric.name,code:id,regionId:id,adcode:id,count:metric?.count??null,hasBusinessData:metric?.hasBusinessData===true,isManagementZone:p.isManagementZone===true,renderOnly:p.renderOnly===true,parentName:p.parentName||metric?.parentName,regionType:p.regionType||metric?.regionType};
}
function mapData(geo){
 indexByRegion=new Map();return geo.features.map((feature,i)=>{const metric=featureMetric(feature),id=metric.regionId;indexByRegion.set(id,i);return {name:feature.properties?.name||metric.name,regionId:id,value:metric.hasBusinessData?metric.count:null,metric,selected:currentScope.selectedRegion===id,isManagementZone:metric.isManagementZone,renderOnly:metric.renderOnly,...(metric.isManagementZone?{itemStyle:{areaColor:palette.soft,borderColor:palette.brand,borderType:'dashed',borderWidth:1.5,opacity:.58}}:{})};});
}
function optionFor(geo){
 const max=Math.max(...currentSnapshot.view.regions.map(r=>r.count||0),1),steps=legendSteps(max),ui=situationUI();
 return {animation:false,aria:{enabled:true,label:{enabled:true,description:'南阳市行政区域地图；双击区县下钻，单击乡镇或街道查看对应合成业务分析。'}},tooltip:{trigger:'item',confine:true,enterable:false,backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1,padding:12,textStyle:{color:palette.text,fontSize:12,fontFamily:palette.font},extraCssText:'border-radius:8px;',formatter:p=>MapTooltip(p.data?.metric,currentScope)},visualMap:{type:'piecewise',show:false,seriesIndex:0,selectedMode:false,pieces:steps.map((s,i)=>({gte:s.min,lte:s.max,color:ui.heat?palette.heat[i]:palette.soft}))},series:[{id:'nanyang-map',type:'map',map:currentMap.mapName,nameProperty:'name',roam:true,scaleLimit:{min:.82,max:2.8},zoom:currentScope.mapZoom||1,center:currentScope.mapCenter||null,selectedMode:'single',data:mapData(geo),itemStyle:{areaColor:palette.soft,borderColor:palette.surface,borderWidth:1.5},select:{itemStyle:{borderColor:palette.brand,borderWidth:3},label:{fontWeight:700,color:palette.text}},emphasis:{itemStyle:{borderColor:palette.brand,borderWidth:2},label:{color:palette.text,fontWeight:700}},label:{show:true,color:palette.text,fontFamily:palette.font,fontSize:12,lineHeight:18,textBorderColor:palette.surface,textBorderWidth:2,formatter:p=>p.data?.isManagementZone?`${p.name}\n功能区`:p.name},labelLayout:{hideOverlap:true}}]};
}
function highlightRow(id,active){document.querySelectorAll(`.region-row[data-region-id="${CSS.escape(id)}"]`).forEach(n=>n.classList.toggle('hovered',active))}
export function reflowSituationMap(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const page=document.querySelector('.situation-page');if(!page)return;const bounds=page.getBoundingClientRect(),gap=parseFloat(getComputedStyle(page).getPropertyValue('--s4'))||16;const rect=selector=>{const el=page.querySelector(selector);return el?.getClientRects().length?el.getBoundingClientRect():null};const left=rect('[data-safe-left]'),right=rect('[data-safe-right]'),tops=[...page.querySelectorAll('[data-safe-top]')].map(el=>el.getBoundingClientRect());let x=left?left.right-bounds.left+gap:gap,endX=right?right.left-bounds.left-gap:bounds.width-gap;const y=Math.max(gap,...tops.map(r=>r.bottom-bounds.top+gap));page.style.setProperty('--inspector-top',`${y}px`);const controls=rect('.map-controls'),legend=rect('.map-legend');if(controls&&controls.left-bounds.left>x+240)endX=Math.min(endX,controls.left-bounds.left-gap);let bottom=bounds.height-gap;if(legend&&legend.right-bounds.left>x)bottom=Math.min(bottom,legend.top-bounds.top-gap);if(endX-x<240){x=gap;endX=bounds.width-gap}const safe={x,y,width:Math.max(160,endX-x),height:Math.max(160,bottom-y)};if(stage)stage.dataset.safeRect=JSON.stringify(safe);const layer=page.querySelector('.map-status-layer');if(layer)Object.assign(layer.style,{left:`${safe.x}px`,top:`${safe.y}px`,width:`${safe.width}px`,height:`${safe.height}px`,right:'auto',bottom:'auto'});if(chart&&!chart.isDisposed()){if(chart.getWidth()!==bounds.width||chart.getHeight()!==bounds.height)chart.resize();const geoBounds=chart.getModel().getSeriesByIndex(0).coordinateSystem.getBoundingRect(),aspect=geoBounds.width/geoBounds.height*.75;chart.setOption({series:[{id:'nanyang-map',layoutCenter:[safe.x+safe.width/2,safe.y+safe.height/2],layoutSize:Math.min(safe.width,safe.height*aspect)}]})}});
}
function observe(){const page=document.querySelector('.situation-page');if(!page)return;const watch=()=>{resizeObserver?.disconnect();resizeObserver=new ResizeObserver(reflowSituationMap);resizeObserver.observe(page);page.querySelectorAll('[data-safe-top],[data-safe-left],[data-safe-right],[data-safe-bottom]').forEach(el=>resizeObserver.observe(el));reflowSituationMap()};mutationObserver=new MutationObserver(watch);const overlays=page.querySelector('[data-situation-overlays]');if(overlays)mutationObserver.observe(overlays,{childList:true,subtree:true});watch()}
export function disposeSituationMap(){generation++;cancelAnimationFrame(frame);clearTimeout(persistTimer);clearTimeout(drillTimer);drillTimer=null;resizeObserver?.disconnect();mutationObserver?.disconnect();resizeObserver=mutationObserver=null;if(chart&&!chart.isDisposed())chart.dispose();chart=null;stage=null;currentMap=null;indexByRegion.clear()}
export async function mountSituationMap({scope,onRegionSelect,onRegionDrill,onPersist}={}){
 disposeSituationMap();stage=document.querySelector('[data-situation-map]');if(!stage)return;if(pendingDrillEntry&&pendingDrillEntry.id!==scope.regionId)pendingDrillEntry=null;const entering=pendingDrillEntry?.id===scope.regionId;if(entering){stage.classList.add('is-drilling-in');stage.dataset.mapDrillTransition='in';pendingDrillEntry=null}currentScope=scope;currentSnapshot=getSituationSnapshot(scope);const run=generation,mountedStage=stage;observe();
 if(!['正常','部分数据'].includes(state.viewState)){status('inactive');return}
 status('loading','<div class="map-load-state" role="status"><span class="map-loading-skeleton"></span><strong>正在加载真实行政区地图</strong><span>本地南阳市 GeoJSON · 按辖区懒加载</span></div>');
 try{
  if(!window.echarts)throw Error('ECharts 运行库未加载');
  currentMap=await loadRegionMap(scope.regionId);if(run!==generation)return;
  stage.dataset.mapFeatureCount=String(currentMap.geo.features.length);stage.dataset.mapLegalFeatureCount=String(currentMap.legalFeatureCount);stage.dataset.mapOverlayFeatureCount=String(currentMap.overlayFeatureCount);stage.dataset.mapSource='local-geojson';stage.dataset.mapName=currentMap.mapName;
  if(scope.regionId!=='411300'&&currentMap.legalFeatureCount===0){status('empty',`<div class="map-load-state map-empty-state" role="status"><strong>当前辖区暂无乡级边界数据</strong><span>GeoJSON 文件已加载，但未包含可绘制的法定乡镇 / 街道 Polygon。</span>${btn('重新加载','situation-map-retry','','secondary')}</div>`);return}
  window.echarts.registerMap(currentMap.mapName,currentMap.geo);palette=readTokens();chart=window.echarts.init(stage.querySelector('[data-situation-map-chart]'),null,{renderer:'canvas'});chart.setOption(optionFor(currentMap.geo));status('ready');reflowSituationMap();if(entering)requestAnimationFrame(()=>requestAnimationFrame(()=>{if(mountedStage===stage){mountedStage.classList.remove('is-drilling-in');mountedStage.dataset.mapDrillTransition='complete'}}));chart.on('mouseover',p=>{if(p.data?.regionId)highlightRow(p.data.regionId,true)});chart.on('mouseout',p=>{if(p.data?.regionId)highlightRow(p.data.regionId,false)});chart.on('click',p=>{if(p.data?.regionId)onRegionSelect?.(p.data.regionId)});chart.on('dblclick',p=>{if(p.data?.regionId&&String(p.data.regionId).length===6)drillIntoRegion(p.data.regionId,onRegionDrill)});chart.on('georoam',()=>{const s=chart.getOption().series[0];scope.mapZoom=s.zoom||1;scope.mapCenter=Array.isArray(s.center)?s.center:null;clearTimeout(persistTimer);persistTimer=setTimeout(()=>onPersist?.(),180)});
 }catch(error){if(run===generation){stage.dataset.mapError=error.message;status('error',`<div class="map-load-state" role="alert"><strong>真实行政区地图加载失败</strong><span>${esc(error.message)}</span>${btn('重新加载','situation-map-retry','','secondary')}</div>`)}}
}
export function updateSituationMap(){if(!chart||chart.isDisposed()){reflowSituationMap();return}currentSnapshot=getSituationSnapshot(currentScope);const max=Math.max(...currentSnapshot.view.regions.map(r=>r.count||0),1);chart.setOption({visualMap:{pieces:legendSteps(max).map((s,i)=>({gte:s.min,lte:s.max,color:situationUI().heat?palette.heat[i]:palette.soft}))},series:[{id:'nanyang-map',zoom:currentScope.mapZoom,center:currentScope.mapCenter||null,data:mapData(currentMap.geo)}]});chart.dispatchAction({type:'unselect',seriesIndex:0,dataIndex:[...indexByRegion.values()]});const index=indexByRegion.get(currentScope.selectedRegion);if(index!==undefined)chart.dispatchAction({type:'select',seriesIndex:0,dataIndex:index});reflowSituationMap()}
export function setSituationMapRegionHover(id,active){if(!chart||chart.isDisposed())return;const dataIndex=indexByRegion.get(String(id));if(dataIndex===undefined)return;chart.dispatchAction({type:active?'highlight':'downplay',seriesIndex:0,dataIndex});chart.dispatchAction({type:active?'showTip':'hideTip',seriesIndex:0,dataIndex})}
export function getSituationMapChart(){return chart}
