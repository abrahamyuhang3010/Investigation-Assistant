import {esc,icon,btn,empty} from './ui.js';
import {TIME_RANGES,CASE_CATEGORIES,ALERT_CATEGORIES,getBreadcrumb,getRegionOptions,getSubcategoryOptions,formatNumber} from './global-situation-data.js';

const number=formatNumber;
const pct=(n,total)=>total?Math.round(n/total*100):0;
export const title=(text,meta='')=>`<div class="situation-section-title"><h2>${esc(text)}</h2>${meta?`<span>${esc(meta)}</span>`:''}</div>`;
export const iconButton=(name,label,action,extra='')=>btn(icon(name),action,`aria-label="${esc(label)}" title="${esc(label)}" ${extra}`,'ghost icon-only');
const selectField=(label,name,options,value)=>`<label class="situation-field"><span>${label}</span><select name="${name}">${options.map(item=>`<option value="${esc(item.id)}" ${item.id===value?'selected':''}>${esc(item.label||item.name)}</option>`).join('')}</select></label>`;

export function GlobalSituationToolbar(view){
 const {scope}=view;
 return `<section class="situation-context floating-panel" aria-label="全域态势筛选条件" data-safe-top>
  <div class="toolbar-primary">
   ${selectField('行政辖区','situation-region-select',getRegionOptions(scope),scope.regionId)}
   ${selectField('时间','situation-time',TIME_RANGES,scope.timeRange)}
   <div class="mode-switch" role="group" aria-label="数据类型">${[['CASE','案件态势'],['POLICE_ALERT','警情态势']].map(([id,label])=>`<button type="button" data-action="situation-mode" data-mode="${id}" aria-pressed="${scope.dataType===id}" class="${scope.dataType===id?'active':''}">${label}</button>`).join('')}</div>
  </div>
  <div class="toolbar-secondary">
   <nav class="situation-breadcrumb" aria-label="行政层级">${getBreadcrumb(scope.regionId).filter(item=>item.level!=='PROVINCE').map((item,i)=>`${i?icon('down','breadcrumb-separator'):''}<button type="button" data-action="situation-region" data-region-id="${item.id}" ${item.id===scope.regionId?'aria-current="page"':''}>${esc(item.name)}</button>`).join('')}</nav>
   <span class="situation-updated">合成快照 · ${view.updatedAt}</span>
  </div>
  ${scope.timeRange==='CUSTOM'?`<div class="custom-dates"><label>起始<input name="situation-custom-start" type="date" value="${esc(scope.customStart)}" max="${esc(scope.customEnd)}"></label><label>结束<input name="situation-custom-end" type="date" value="${esc(scope.customEnd)}" min="${esc(scope.customStart)}" max="2026-09-21"></label></div>`:''}
 </section>`;
}
function SituationTrend(view){
 const max=Math.max(...view.trend.map(x=>x.value),1),width=248,height=48;
 const points=view.trend.map((v,i)=>`${i*width/(view.trend.length-1)},${height-v.value/max*(height-8)}`).join(' ');
 return `<svg class="situation-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(view.time.label)}趋势"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>${view.trend.map((v,i)=>`<circle cx="${i*width/(view.trend.length-1)}" cy="${height-v.value/max*(height-8)}" r="4" fill="transparent" tabindex="0"><title>${v.label}：${v.value}</title></circle>`).join('')}</svg>`;
}
export function SituationPanel(view,ui){
 if(ui.leftCollapsed)return `<div class="panel-peek left-peek floating-panel" data-safe-left>${iconButton('chart','展开态势面板','situation-collapse','data-panel="left" aria-expanded="false"')}</div>`;
 const noun=view.scope.dataType==='CASE'?'案件':'警情',unit=view.scope.dataType==='CASE'?'起':'条';
 return `<aside class="situation-left floating-panel" aria-label="全域态势统计" data-safe-left>
  <header class="panel-heading"><div><span class="eyebrow">全域态势</span><h1>${esc(view.region.name)}</h1></div>${iconButton('close','收起态势面板','situation-collapse','data-panel="left" aria-expanded="true"')}</header>
  <section class="summary-card"><div class="summary-total"><div><span>${esc(view.region.name)}${noun}数量</span><strong data-summary-count="${view.total}">${view.totalText}<small>${unit}</small></strong></div><div class="summary-delta"><b>${view.metric.comparison>=0?'+':''}${view.metric.comparison.toFixed(1)}%</b><span>较上一周期</span></div></div>${SituationTrend(view)}<div class="trend-caption"><span>${esc(view.trend[0].label)}</span><span>${esc(view.time.label)}</span><span>${esc(view.trend.at(-1).label)}</span></div>
   ${title(`重点${noun}类型 TOP4`)}<div class="type-grid">${view.categoryCards.map(item=>`<button class="type-stat ${item.active?'active':''}" type="button" data-action="situation-category" data-category-id="${item.id}" aria-pressed="${item.active}"><span>${esc(item.label)}</span><strong>${number(item.value)}<small>${unit}</small></strong></button>`).join('')}</div>
   ${(view.scope.dataType==='CASE'?view.scope.caseCategory:view.scope.alertCategory)!=='ALL'?btn('清除类型筛选','situation-category','data-category-id="ALL"','ghost clear-filter'):''}
  </section>
  <section class="region-card">${title(view.region.level==='CITY'?'区县实时概览':'乡镇 / 街道概览',`${view.regions.length} 个辖区`)}<p class="muted-caption">单击选中 · 双击地图或按钮进入</p><div class="region-list" aria-label="辖区排名">${view.regions.map((item,i)=>`<button type="button" class="region-row ${view.scope.selectedRegion===item.id?'selected':''}" data-action="situation-select" data-region-id="${item.id}" data-hover-region="${item.id}" aria-pressed="${view.scope.selectedRegion===item.id}"><span class="rank-no">${String(i+1).padStart(2,'0')}</span><span class="region-row-label"><strong>${esc(item.name)}</strong><small>${item.level==='STREET'?'演示街道 · 非完整行政目录':`行政区划代码 ${item.code}`}</small></span><span class="region-count">${number(item.count)}<small>${unit}</small>${item.allowed===false?icon('shield'):''}</span></button>`).join('')||'<p class="muted-caption">下级行政区数据待接入</p>'}</div></section>
 </aside>`;
}
export function SituationInsight(view,ui){
 const police=view.scope.dataType!=='CASE',noun=police?'警情':'案件';
 const text=police?`高频类型为 <strong>${esc(view.metric.topCategory)}</strong>，重点关注 <strong>${view.alerts.hours[0].label}</strong> 时段，重复报警 <strong>${number(view.alerts.repeated)} 条</strong>。`:`受害人以 <strong>${esc(view.top.age)}、${esc(view.top.occupation)}、${esc(view.top.gender)}</strong> 为主，<strong>${esc(view.top.method)}</strong> 为主要作案手段，建议重点宣传防范。`;
 return `<section class="situation-banner floating-panel ${ui.insightCollapsed?'collapsed':''}" aria-label="AI 态势洞察" data-safe-top><div class="insight-label">${icon('graph')}<strong>AI 态势洞察</strong><span>基于合成数据</span>${iconButton(ui.insightCollapsed?'down':'close',ui.insightCollapsed?'展开 AI 洞察':'收起 AI 洞察','situation-collapse',`data-panel="insight" aria-expanded="${!ui.insightCollapsed}"`)}</div>${ui.insightCollapsed?'':`<p>${esc(view.time.short)}，<strong>${esc(view.region.name)}</strong>${view.category.id==='ALL'?'':esc(view.category.label)}${noun}共 <strong data-insight-count="${view.total}">${view.totalText} ${police?'条':'起'}</strong>。${view.total?text:'当前筛选范围内暂无数据。'}</p>`}</section>`;
}
function barRows(items,unit='人'){
 const max=Math.max(...items.map(x=>x.value),1);
 return `<div class="profile-bars">${items.map(item=>`<div class="profile-bar"><div><span>${esc(item.label)}</span><b>${number(item.value)}${unit}</b></div><div class="bar-track" aria-hidden="true"><i style="width:${item.value/max*100}%"></i></div></div>`).join('')}</div>`;
}
function CaseContext(view,partial){
 const {scope,victim}=view,subcategories=getSubcategoryOptions(scope);
 return `<div class="profile-filters">${selectField('案件类型','situation-case-category',CASE_CATEGORIES,scope.caseCategory)}${subcategories.length?selectField('二级子类','situation-case-subcategory',subcategories,scope.caseSubCategory):''}</div>
  <div class="victim-total"><span>总受害人数</span><strong>${victim.totalText}<small>人</small></strong></div>
  <section class="insight-block"><h3>性别分布</h3>${victim.gender.map(item=>`<div class="gender-row"><span>${esc(item.label)}</span><strong>${pct(item.value,victim.total)}%</strong><small>${number(item.value)} 人</small><div class="bar-track"><i style="width:${pct(item.value,victim.total)}%"></i></div></div>`).join('')}</section>
  <section class="insight-block"><h3>年龄分布</h3>${barRows(victim.age)}</section>
  <section class="insight-block"><h3>职业分布 <small>TOP 5</small></h3>${partial?`<div class="module-error" role="status">${icon('info')}<span>职业分布加载失败<br><small>完整度待确认，不以 0 代替缺失</small></span>${btn('重试','situation-occupation-retry','','ghost')}</div>`:barRows(victim.occupations)+`<p class="muted-caption">其他 / 未知 ${number(victim.unknownOccupation)} 人 · TOP5 非完整分布</p>`}</section>
  <section class="insight-block"><h3>作案手段排行</h3><div class="method-ranking">${victim.methods.map((item,i)=>`<button type="button" class="${item.active?'active':''}" data-action="situation-method" data-method-id="${item.id}" aria-pressed="${item.active}"><span class="rank-no">${String(i+1).padStart(2,'0')}</span><span>${esc(item.label)}</span><strong>${number(item.value)}<small>起</small></strong></button>`).join('')}</div>${scope.crimeMethod!=='ALL'?btn('清除作案手段','situation-method','data-method-id="ALL"','ghost clear-filter'):''}</section>`;
}
function PoliceAlertContext(view){
 return `<div class="profile-filters">${selectField('警情类型','situation-alert-category',ALERT_CATEGORIES,view.scope.alertCategory)}</div><section class="insight-block"><h3>警情类型分布</h3>${barRows(view.alerts.typeDistribution,'条')}</section><section class="insight-block"><h3>高频报警时段</h3>${barRows(view.alerts.hours,'条')}</section><section class="insight-block"><h3>高频区域</h3>${barRows(view.alerts.addresses,'条')}<p class="muted-caption">地址级明细待真实接口接入</p></section><section class="repeat-alert"><span>重复报警</span><strong>${number(view.alerts.repeated)} 条</strong><small>${view.alerts.repeatedRate.toFixed(1)}%</small></section>`;
}
export function ContextInspector(view,ui,{partial=false}={}){
 if(ui.rightCollapsed)return `<div class="panel-peek right-peek floating-panel" data-safe-right>${iconButton('user','展开洞察面板','situation-collapse','data-panel="right" aria-expanded="false"')}</div>`;
 const selected=!!view.scope.selectedRegion,noun=view.scope.dataType==='CASE'?'案件':'警情';
 return `<aside class="situation-right floating-panel" aria-label="辖区洞察" data-safe-right><header class="panel-heading"><div><span class="eyebrow">${selected?'选中辖区':'当前辖区'}</span><h2>${esc(view.region.name)}</h2></div>${iconButton('close','收起洞察面板','situation-collapse','data-panel="right" aria-expanded="true"')}</header>
 <div class="inspector-summary"><div><span>${noun}总量</span><strong data-context-count="${view.total}">${view.totalText}<small>${noun==='案件'?'起':'条'}</small></strong></div><span class="metric-change">${view.metric.comparison>=0?'+':''}${view.metric.comparison.toFixed(1)}% <small>环比</small></span></div>
 <div class="inspector-actions">${btn('进入辖区','situation-enter',`data-region-id="${esc(view.region.id)}" ${!selected||view.region.allowed===false?'disabled':''}`,'primary')}${selected?btn('取消选择','situation-clear-selection','','ghost'):'<span>请先选择地图或列表区域</span>'}</div>
 <div class="inspector-scroll">${title(view.scope.dataType==='CASE'?'受害人画像分析':'警情结构分析')}${view.total?(view.scope.dataType==='CASE'?CaseContext(view,partial):PoliceAlertContext(view)):empty(`当前筛选范围内暂无${noun}数据`,'请调整筛选范围。')}</div></aside>`;
}
export function MapTooltip(metric,scope){
 if(!metric)return '暂无指标数据';
 return `<div class="situation-tooltip"><strong>${esc(metric.name)}</strong><dl><dt>${scope.dataType==='CASE'?'案件数量':'警情数量'}</dt><dd>${number(metric.count)}${scope.dataType==='CASE'?'起':'条'}</dd><dt>环比</dt><dd>${metric.comparison>=0?'+':''}${metric.comparison.toFixed(1)}%</dd><dt>高发类型</dt><dd>${esc(metric.topCategory)}</dd>${scope.dataType==='CASE'?`<dt>TOP 作案手段</dt><dd>${esc(metric.topMethod)}</dd>`:''}</dl><small>${metric.allowed===false?'暂无该辖区数据访问权限':'单击选中 · 双击进入辖区'}</small></div>`;
}
