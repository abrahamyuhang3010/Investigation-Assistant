import {esc,icon,btn,empty} from './ui.js';
import {TIME_RANGES,CASE_CATEGORIES,ALERT_CATEGORIES,getBreadcrumb,getRegionOptions,getSubcategoryOptions,formatNumber} from './global-situation-data.js';

const number=formatNumber;
const pct=(n,total)=>total?Math.round(n/total*100):0;

export const title=(text,meta='')=>`<div class="situation-section-title"><h2>${esc(text)}</h2>${meta?`<span>${esc(meta)}</span>`:''}</div>`;
export const iconButton=(name,label,action,extra='')=>btn(icon(name),action,`aria-label="${esc(label)}" title="${esc(label)}" ${extra}`,'ghost icon-only');
const scopeLabel=item=>getBreadcrumb(item.id).map(part=>part.name).join(' / ');
const selectField=(label,name,options,value,{scope=false}={})=>`<label class="situation-field"><span>${esc(label)}</span><select name="${name}" aria-label="${esc(label)}">${options.map(item=>`<option value="${esc(item.id)}" ${item.id===value?'selected':''}>${esc(scope?scopeLabel(item):(item.label||item.name))}</option>`).join('')}</select></label>`;
const signed=n=>`${n>=0?'+':''}${n.toFixed(1)}%`;
const moduleAsset=(name,className='module-icon')=>`<span class="${className}" aria-hidden="true"><img class="module-asset-light" src="/assets/global-situation/${name}.svg" alt=""><img class="module-asset-dark" src="/assets/global-situation/${name}-dark.svg" alt=""></span>`;
const assetButton=(name,label,panel,className='panel-asset-button')=>btn(moduleAsset(name,'module-icon'), 'situation-collapse', `data-panel="${panel}" aria-label="${esc(label)}" title="${esc(label)}" aria-expanded="false"`, `ghost icon-only ${className}`);

export function GlobalSituationToolbar(view){
 const {scope}=view;
 return `<section class="situation-context floating-panel" aria-label="全域态势筛选条件" data-safe-top>
  <div class="toolbar-primary">
   ${selectField('行政辖区','situation-region-select',getRegionOptions(scope),scope.regionId,{scope:true})}
   ${selectField('时间','situation-time',TIME_RANGES,scope.timeRange)}
   <div class="mode-switch" role="group" aria-label="数据类型">${[['CASE','案件态势'],['POLICE_ALERT','警情态势']].map(([id,label])=>`<button type="button" data-action="situation-mode" data-mode="${id}" aria-pressed="${scope.dataType===id}" class="${scope.dataType===id?'active':''}">${label}</button>`).join('')}</div>
  </div>
  ${scope.timeRange==='CUSTOM'?`<div class="custom-dates"><label>起始<input name="situation-custom-start" type="date" value="${esc(scope.customStart)}" max="${esc(scope.customEnd)}"></label><label>结束<input name="situation-custom-end" type="date" value="${esc(scope.customEnd)}" min="${esc(scope.customStart)}" max="2026-09-21"></label></div>`:''}
 </section>`;
}

function SituationTrend(view){
 const max=Math.max(...view.trend.map(x=>x.value),1),width=248,height=52;
 const points=view.trend.map((v,i)=>`${i*width/(view.trend.length-1)},${height-6-v.value/max*(height-14)}`).join(' ');
 return `<div class="trend-block"><svg class="situation-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(view.time.label)}趋势"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>${view.trend.map((v,i)=>`<circle cx="${i*width/(view.trend.length-1)}" cy="${height-6-v.value/max*(height-14)}" r="5" fill="transparent" tabindex="0"><title>${v.label}：${v.value}</title></circle>`).join('')}</svg><div class="trend-caption"><span>${esc(view.trend[0].label)}</span><strong>${esc(view.time.label)}</strong><span>${esc(view.trend.at(-1).label)}</span></div></div>`;
}

function PrimaryKpi(view,noun,unit){
 const delta=view.metric.comparison;
 return `<div class="summary-total"><div class="kpi-primary"><span>${noun}总量</span><strong data-summary-count="${view.total}">${view.totalText}<small>${unit}</small></strong></div><div class="summary-delta ${delta<0?'negative':''}"><b>${icon('trend-up')}<span>${signed(delta)}</span></b><span>较上一周期</span></div></div>`;
}

function CategoryTop(view,noun,unit){
 const active=(view.scope.dataType==='CASE'?view.scope.caseCategory:view.scope.alertCategory)!=='ALL';
 return `<section class="category-section">${title(`重点${noun}类型 TOP4`)}<div class="type-grid">${view.categoryCards.map(item=>`<button class="type-stat ${item.active?'active':''}" type="button" data-action="situation-category" data-category-id="${item.id}" aria-pressed="${item.active}"><span>${esc(item.label)}</span><strong>${number(item.value)}<small>${unit}</small></strong></button>`).join('')}</div>${active?btn('清除类型筛选','situation-category','data-category-id="ALL"','ghost clear-filter'):''}</section>`;
}

function RegionRanking(view,unit){
 const heading=view.region.level==='CITY'?'区县实时概览':'乡镇 / 街道目录';
 return `<section class="region-card">${title(heading,`${view.regions.length} 个辖区`)}<div class="region-list" aria-label="辖区排名">${view.regions.map((item,i)=>{const zone=item.isManagementZone;return `<button type="button" class="region-row ${view.scope.selectedRegion===item.id?'selected':''}" data-action="situation-select" data-region-id="${item.id}" data-hover-region="${item.id}" aria-pressed="${view.scope.selectedRegion===item.id}"><span class="rank-no">${String(i+1).padStart(2,'0')}</span><span class="region-row-label"><strong>${esc(item.name)}</strong><small>${zone?'功能区 · 仅地图显示':item.level==='TOWNSHIP'?`${esc(item.regionTypeLabel||'乡级行政单元')} · ${item.dataStatus==='missing_geometry'?'边界缺失（未绘制） · 合成数据':'合成业务数据'}`:`行政区划代码 ${item.code}`}</small></span><span class="region-count"><b>${item.count==null?'—':number(item.count)}</b><small>${item.count==null?'暂无数据':unit}</small>${item.allowed===false?icon('shield'):''}</span></button>`}).join('')||'<p class="muted-caption region-empty">暂无下级行政区</p>'}</div></section>`;
}

export function SituationPanel(view,ui){
 if(ui.leftCollapsed)return `<div class="panel-peek left-peek floating-panel" data-safe-left>${assetButton('situation-panel','展开态势面板','left')}</div>`;
 const noun=view.scope.dataType==='CASE'?'案件':'警情',unit=view.scope.dataType==='CASE'?'起':'条';
 return `<aside class="situation-left floating-panel" aria-label="${noun}态势关键指标" data-safe-left>
  <header class="panel-heading"><div class="panel-title">${moduleAsset('situation-panel')}<h1>${noun}态势</h1></div>${iconButton('close','收起态势面板','situation-collapse','data-panel="left" aria-expanded="true"')}</header>
  <section class="summary-card">${PrimaryKpi(view,noun,unit)}${SituationTrend(view)}${CategoryTop(view,noun,unit)}</section>
  ${RegionRanking(view,unit)}
 </aside>`;
}

export function SituationInsight(view,ui){
 const police=view.scope.dataType!=='CASE',noun=police?'警情':'案件';
 const detail=police?`高频类型为 <strong>${esc(view.metric.topCategory)}</strong>，重点关注 <strong>${esc(view.alerts.hours[0].label)}</strong> 时段，重复报警 <strong>${number(view.alerts.repeated)} 条</strong>。`:`受害人以 <strong>${esc(view.top.age)}</strong>、${esc(view.top.occupation)}、${esc(view.top.gender)} 为主，<strong>${esc(view.top.method)}</strong> 为主要作案手段，建议重点宣传防范。`;
 const category=view.category.id==='ALL'?'':`${esc(view.category.label)}筛选下，`;
 if(ui.insightCollapsed)return `<section class="situation-banner collapsed" aria-label="AI 态势洞察" data-safe-top>${assetButton('ai-insight','展开 AI 态势洞察','insight','ai-collapsed-trigger')}</section>`;
 return `<section class="situation-banner floating-panel" aria-label="AI 态势洞察" data-safe-top><div class="ai-icon">${moduleAsset('ai-insight')}</div><div class="ai-content"><div class="insight-label"><strong>AI 态势洞察</strong></div><p>${esc(view.time.short)}，${category}共发生${noun} <strong data-insight-count="${view.total}">${view.totalText} ${police?'条':'起'}</strong>。${view.total?detail:'当前筛选范围内暂无数据。'}</p></div>${iconButton('close','收起 AI 态势洞察','situation-collapse',`data-panel="insight" aria-expanded="true"`)}</section>`;
}

function distributionRows(items,{unit='人',total=0,percentage=false}={}){
 const max=Math.max(...items.map(x=>x.value),1);
 return `<div class="profile-bars">${items.map(item=>`<div class="profile-bar"><div class="distribution-line"><span>${esc(item.label)}</span><span class="distribution-values">${percentage?`<b>${pct(item.value,total)}%</b>`:''}<small>${number(item.value)}${unit}</small></span></div><div class="bar-track" aria-hidden="true"><i style="width:${percentage?pct(item.value,total):item.value/max*100}%"></i></div></div>`).join('')}</div>`;
}

function CaseContext(view,partial){
 const {scope,victim}=view,subcategories=getSubcategoryOptions(scope);
 return `<div class="profile-filters">${selectField('案件类型','situation-case-category',CASE_CATEGORIES,scope.caseCategory)}${subcategories.length?selectField('二级子类','situation-case-subcategory',subcategories,scope.caseSubCategory):''}</div>
  <div class="victim-total"><span>总受害人数</span><strong>${victim.totalText}<small>人</small></strong></div>
  <section class="insight-block"><h3>性别分布</h3>${distributionRows(victim.gender,{total:victim.total,percentage:true})}</section>
  <section class="insight-block"><h3>年龄分布</h3>${distributionRows(victim.age)}</section>
  <section class="insight-block"><h3>职业分布 <small>TOP 5</small></h3>${partial?`<div class="module-error" role="status">${icon('info')}<span>职业分布加载失败<br><small>完整度待确认，不以 0 代替缺失</small></span>${btn('重试','situation-occupation-retry','','ghost')}</div>`:distributionRows(victim.occupations)+`<p class="muted-caption">其他 / 未知 ${number(victim.unknownOccupation)} 人 · TOP5 非完整分布</p>`}</section>
  <section class="insight-block"><h3>作案手段排行</h3><div class="method-ranking">${victim.methods.map((item,i)=>`<button type="button" class="${item.active?'active':''}" data-action="situation-method" data-method-id="${item.id}" aria-pressed="${item.active}"><span class="rank-no">${String(i+1).padStart(2,'0')}</span><span>${esc(item.label)}</span><strong>${number(item.value)}<small>起</small></strong></button>`).join('')}</div>${scope.crimeMethod!=='ALL'?btn('清除作案手段','situation-method','data-method-id="ALL"','ghost clear-filter'):''}</section>`;
}

function PoliceAlertContext(view){
 return `<div class="profile-filters">${selectField('警情类型','situation-alert-category',ALERT_CATEGORIES,view.scope.alertCategory)}</div><section class="insight-block"><h3>警情类型分布</h3>${distributionRows(view.alerts.typeDistribution,{unit:'条'})}</section><section class="insight-block"><h3>高频报警时段</h3>${distributionRows(view.alerts.hours,{unit:'条'})}</section><section class="insight-block"><h3>高频区域</h3>${distributionRows(view.alerts.addresses,{unit:'条'})}<p class="muted-caption">地址级明细待真实接口接入</p></section><section class="repeat-alert"><span>重复报警</span><strong>${number(view.alerts.repeated)} 条</strong><small>${view.alerts.repeatedRate.toFixed(1)}%</small></section>`;
}

export function ContextInspector(view,ui,{partial=false}={}){
 if(ui.rightCollapsed)return `<div class="panel-peek right-peek floating-panel" data-safe-right>${assetButton('analysis-panel','展开分析面板','right')}</div>`;
 if(!view.hasBusinessData){const zone=view.region.isManagementZone;return `<aside class="situation-right floating-panel" aria-label="地图选择信息" data-safe-right><header class="panel-heading"><div class="panel-title">${moduleAsset('analysis-panel')}<h2>地图选择</h2></div>${iconButton('close','收起分析面板','situation-collapse','data-panel="right" aria-expanded="true"')}</header><div class="inspector-scroll"><section class="map-selection-inspector"><div class="selection-kicker">${zone?'功能区 / 仅地图显示':'乡镇 / 街道'}</div><h2>${esc(view.region.name)}</h2><dl><dt>代码</dt><dd>${esc(view.region.code)}</dd><dt>上级</dt><dd>${esc(view.region.parentName||view.region.parentId||'—')}</dd><dt>统计口径</dt><dd>${zone?'不计入13个法定区县统计':'保留区县全域口径'}</dd></dl><p class="muted-caption">当前区域没有可用业务数据。</p></section></div></aside>`}
 const noun=view.scope.dataType==='CASE'?'案件':'警情',analysis=view.scope.dataType==='CASE'?'案件画像':'警情分析';
 return `<aside class="situation-right floating-panel" aria-label="${analysis}" data-safe-right><header class="panel-heading"><div class="panel-title">${moduleAsset('analysis-panel')}<h2>分析面板</h2></div>${iconButton('close','收起分析面板','situation-collapse','data-panel="right" aria-expanded="true"')}</header><div class="inspector-summary"><div><span>${noun}总量</span><strong data-context-count="${view.total}">${view.totalText}<small>${noun==='案件'?'起':'条'}</small></strong></div><div class="metric-change ${view.metric.comparison<0?'negative':''}"><b>${signed(view.metric.comparison)}</b><small>环比</small></div></div>${view.region.isManagementZone?'<p class="management-metric-note">功能区为独立合成指标，不计入 13 个法定区县汇总。</p>':''}<div class="inspector-scroll">${title(view.scope.dataType==='CASE'?'受害人画像分析':'警情结构分析')}${view.total?(view.scope.dataType==='CASE'?CaseContext(view,partial):PoliceAlertContext(view)):empty(`当前筛选范围内暂无${noun}数据`,'请调整筛选范围。')}</div></aside>`;
}

export function MapTooltip(metric,scope){
 if(!metric)return '暂无指标数据';
 const zone=metric.isManagementZone||metric.renderOnly;
 if(zone)return `<div class="situation-tooltip"><div class="tooltip-heading"><strong>${esc(metric.name)}</strong><span>${esc(metric.code)}</span></div><dl><dt>类型</dt><dd>功能区 / 仅地图显示</dd><dt>${scope.dataType==='CASE'?'案件数量':'警情数量'}</dt><dd>${number(metric.count)}${scope.dataType==='CASE'?'起':'条'}</dd><dt>统计口径</dt><dd>独立合成指标，不计入法定区县汇总</dd></dl><div class="tooltip-helper">单击查看合成分析 · 不改变全域态势</div></div>`;
 if(metric.hasBusinessData===false)return `<div class="situation-tooltip"><div class="tooltip-heading"><strong>${esc(metric.name)}</strong><span>${esc(metric.code)}</span></div><dl><dt>类型</dt><dd>${esc(metric.regionTypeLabel||metric.regionType||'乡级行政单元')}</dd><dt>上级</dt><dd>${esc(metric.parentName||'—')}</dd><dt>业务数据</dt><dd>暂无数据</dd></dl><div class="tooltip-helper">单击查看选择信息</div></div>`;
 return `<div class="situation-tooltip"><div class="tooltip-heading"><strong>${esc(metric.name)}</strong><span>${esc(metric.code)}</span></div><dl><dt>${scope.dataType==='CASE'?'案件数量':'警情数量'}</dt><dd>${number(metric.count)}${scope.dataType==='CASE'?'起':'条'}</dd><dt>环比</dt><dd>${signed(metric.comparison)}</dd><dt>高发类型</dt><dd>${esc(metric.topCategory)}</dd>${scope.dataType==='CASE'?`<dt>TOP 作案手段</dt><dd>${esc(metric.topMethod)}</dd>`:''}</dl><div class="tooltip-helper">单击查看合成分析${metric.level==='TOWNSHIP'?' · 当前已是最细层级':' · 双击进入辖区'}</div></div>`;
}
