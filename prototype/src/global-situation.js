import {icon,btn,empty} from './ui.js';
import {state} from './state.js';
import {defaultGlobalScope,getSituationSnapshot,getChildren} from './global-situation-data.js';
import {GlobalSituationToolbar,SituationPanel,SituationInsight,ContextInspector,iconButton} from './global-situation-panels.js';

export function ensureGlobalScope(){
 if(!state.globalScope)state.globalScope=defaultGlobalScope();
 for(const [key,value] of Object.entries(defaultGlobalScope()))if(state.globalScope[key]===undefined)state.globalScope[key]=value;
 if(state.globalScope.selectedRegion&&!getChildren(state.globalScope.regionId).some(r=>r.id===state.globalScope.selectedRegion&&r.allowed!==false))state.globalScope.selectedRegion=null;
 return state.globalScope;
}
export function situationUI(){
 if(!state.situationUI)state.situationUI={leftCollapsed:false,rightCollapsed:false,insightCollapsed:false,layersOpen:false,heat:true,occupationRecovered:[]};
 return state.situationUI;
}
let viewportMode='';
export function syncSituationResponsive(){
 const mode=innerWidth<800?'narrow':innerWidth<1100?'compact':'desktop';
 if(mode===viewportMode)return false;
 viewportMode=mode;const ui=situationUI();
 if(mode!=='desktop')ui.rightCollapsed=true;
 if(mode==='narrow')ui.leftCollapsed=true;
 return true;
}
export function legendSteps(max){
 const step=Math.max(1,Math.ceil(max/5));
 return Array.from({length:5},(_,i)=>({min:i===0?0:i*step+1,max:(i+1)*step,label:i===0?`0–${step}`:`${i*step+1}–${(i+1)*step}`}));
}
function MapLegend(view,ui){
 const steps=legendSteps(Math.max(...view.regions.map(r=>r.count),1));
 return `<section class="map-legend floating-panel" aria-label="地图图例" data-safe-bottom><span>${view.scope.dataType==='CASE'?'案件':'警情'}数量${ui.heat?'':' · 热力已关闭'}</span><div>${steps.map((s,i)=>`<span><i class="heat-${i}" aria-hidden="true"></i><small>${s.label}</small></span>`).join('')}</div><small>真实行政边界 · 指标为合成数据</small></section>`;
}
function MapControls(ui){
 return `<div class="map-control-group" data-safe-bottom><div class="map-controls floating-panel" role="group" aria-label="地图操作">${iconButton('plus','地图放大','situation-map-zoom','data-delta="0.18"')}${iconButton('minus','地图缩小','situation-map-zoom','data-delta="-0.18"')}${iconButton('refresh','重置地图与行政区','situation-map-reset')}${iconButton('settings','地图图层','situation-layers',`aria-expanded="${ui.layersOpen}" aria-controls="situation-layers"`)}</div>${ui.layersOpen?`<section id="situation-layers" class="layer-popover floating-panel" aria-label="图层设置"><header><strong>地图图层</strong>${iconButton('close','关闭图层设置','situation-layers')}</header><label><input type="checkbox" name="situation-heat" ${ui.heat?'checked':''}>${icon('chart')}案件 / 警情热力</label><label><input type="checkbox" disabled>${icon('shield')}警力点位 <small>待数据</small></label><label><input type="checkbox" disabled>${icon('briefcase')}重点场所 <small>待数据</small></label></section>`:''}</div>`;
}
function overlayContent(snapshot,ui){
 const {view,context}=snapshot;
 const partial=(context.partial||state.viewState==='部分数据')&&!ui.occupationRecovered?.includes(context.region.id);
 return `${SituationPanel(view,ui)}<div class="situation-top">${GlobalSituationToolbar(view)}${SituationInsight(context,ui)}</div>${ContextInspector(context,ui,{partial})}${MapLegend(view,ui)}${MapControls(ui)}`;
}
function stateMarkup(view){
 if(state.viewState==='加载中')return `<div class="situation-state-skeleton" role="status" aria-label="正在加载全域态势"><div></div><div></div><div></div></div>`;
 const noun=view.scope.dataType==='CASE'?'案件':'警情';
 const messages={空状态:[`当前筛选范围内暂无${noun}数据`,'请调整时间范围或筛选条件。'],加载失败:['全域态势加载失败','筛选条件已保留，请重新加载。'],无权限:['暂无该辖区数据访问权限','请联系管理员申请，不会继续下钻。'],数据过期:['当前数据快照已过期','刷新后继续研判。']};
 if(messages[state.viewState])return `<section class="situation-state floating-panel" role="status">${empty(...messages[state.viewState],btn('重新加载','situation-retry','','primary'))}</section>`;
 return '';
}
export function renderGlobalSituation(){
 syncSituationResponsive();
 const snapshot=getSituationSnapshot(ensureGlobalScope()),ui=situationUI(),status=stateMarkup(snapshot.view);
 // Map is the canvas; every panel is an overlay, not a grid column.
 return `<main id="main" class="situation-page" data-left-collapsed="${ui.leftCollapsed}" data-right-collapsed="${ui.rightCollapsed}" aria-label="全域态势地图工作台"><div class="map-stage" data-situation-map data-region-level="${snapshot.view.region.level}"><div class="situation-echarts" data-situation-map-chart aria-label="南阳市行政区域地图"></div><div class="map-status-layer" data-map-status></div></div><div class="situation-overlays" data-situation-overlays>${status?`<div class="situation-top">${GlobalSituationToolbar(snapshot.view)}</div>${status}`:overlayContent(snapshot,ui)}</div></main>`;
}
/** Selection/collapse updates overlays only; preserve canvas, pan and dblclick event stream. */
export function refreshSituationOverlays(){
 const page=document.querySelector('.situation-page'),root=page?.querySelector('[data-situation-overlays]');
 if(!root||!['正常','部分数据'].includes(state.viewState))return;
 const focused=document.activeElement;
 const focusTarget=focused?.closest('[data-action]');
 const focusKey=focusTarget?{action:focusTarget.dataset.action,region:focusTarget.dataset.regionId,panel:focusTarget.dataset.panel}:null;
 const scrolls=[...root.querySelectorAll('.region-list,.inspector-scroll')].map(n=>({cls:n.className,top:n.scrollTop}));
 const ui=situationUI();
 page.dataset.leftCollapsed=String(ui.leftCollapsed);page.dataset.rightCollapsed=String(ui.rightCollapsed);
 root.innerHTML=overlayContent(getSituationSnapshot(ensureGlobalScope()),ui);
 scrolls.forEach(({cls,top})=>{const el=root.querySelector(`.${cls}`);if(el)el.scrollTop=top});
 if(focusKey){const same=[...root.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusKey.action&&el.dataset.regionId===focusKey.region&&el.dataset.panel===focusKey.panel);same?.focus({preventScroll:true})}
}
