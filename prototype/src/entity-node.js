import {esc, btn} from './ui.js';
import {formatCompactDateTime,formatDateTime,formatMoney} from './formatters.js';

export const categories = {
  funds: '资金流', comm: '通讯流', net: '网络流', person: '人员流', case: '案件',
};
const statusNames = {Idle:'', Running:'运行中', Paused:'已暂停', Success:'执行成功', Error:'执行失败', Exception:'执行异常', Waiting:'等待执行'};
const investigationIcons = {
  person:'person.svg',
  'person-phone':'person-phone.svg',
  'person-location':'person-location.svg',
  'person-device-address':'person-location.svg',
  'victim-bank':'fund-bank.svg',
  'fund-bank-l1':'fund-bank.svg',
  'fund-bank-l2':'fund-bank.svg',
  'fund-account-l1':'fund-account.svg',
  'fund-account-l2':'fund-account.svg',
  'comm-phone':'comm-phone.svg',
  'comm-device':'comm-device.svg',
  'comm-location':'comm-location.svg',
  'net-account':'net-globe.svg',
  'net-group':'net-group.svg',
  'net-space':'net-globe.svg',
  'net-app':'net-app.svg',
  'net-apk':'net-file.svg',
  'net-terminal':'net-device.svg',
  'net-wifi':'net-wifi.svg',
  'net-router':'net-router.svg',
  'net-sdk':'net-code.svg',
};
const investigationCategories = {
  person:'person','person-phone':'person','person-location':'person','person-device-address':'person',
  'victim-bank':'funds','fund-bank-l1':'funds','fund-bank-l2':'funds','fund-account-l1':'funds','fund-account-l2':'funds',
  'comm-phone':'comm','comm-device':'comm','comm-location':'comm',
  'net-account':'net','net-group':'net','net-space':'net','net-app':'net','net-apk':'net','net-terminal':'net','net-wifi':'net','net-router':'net','net-sdk':'net',
};
const caseTypeMap = {
  b1028:'victim-bank', b6071:'fund-bank-l1', b8820:'fund-bank-l2', b3359:'fund-bank-l1', pay:'fund-account-l1',
  phone:'comm-phone', p0431:'comm-phone', p8890:'comm-phone', net:'net-account', domain:'net-space', ip:'net-space',
  device:'net-terminal', dev2:'net-terminal', victim:'person', personb:'person', persona:'person', e01:'person-location', e02:'person-location', locp:'person-location', locq:'person-location',
};

export const investigationEntityTypes = Object.freeze(Object.keys(investigationIcons));

export function categoryFor(entity) {
  return entity.icon || ({账户:'funds',商户:'funds',号码:'comm',通讯:'comm',网络:'net',设备:'net',案件:'case'}[entity.type] || 'person');
}

function present(value) { return value !== undefined && value !== null && value !== ''; }
function first(...values) { return values.find(present); }
function cleanIdentifier(value) {
  return String(value || '').replace(/^[▣◉]\s*/, '').replace(/[　]+/g, ' ').trim();
}
function list(value) {
  if (Array.isArray(value)) return value.filter(present).map(String);
  if (!present(value)) return [];
  return String(value).split(/[、,，]|\s{2,}|　+/).map(item=>item.trim()).filter(Boolean);
}
function compactTime(value) {
  return present(value) ? formatCompactDateTime(value,{empty:''}) : '';
}
function fullTime(value) {
  return present(value) ? formatDateTime(value,{empty:''}) : '';
}
function moneyText(value) {
  return present(value) ? formatMoney(value,{empty:''}) : '';
}
function legacyLines(entity) {
  return cleanIdentifier(entity.identifier).split(/\n+/).map(item=>item.trim()).filter(Boolean);
}
function legacyMetrics(entity) {
  if (Array.isArray(entity.summaryMetrics)) return entity.summaryMetrics;
  if (!present(entity.stat)) return [];
  return String(entity.stat).split(/\s*[·|]\s*/).map(part=>{
    const match=part.trim().match(/^(.+?)[：:]?\s*[¥￥]?([\d,.]+(?:\.\d+)?(?:元)?)$/);
    return match ? {label:match[1].trim(),value:moneyText(match[2])} : {label:part.trim(),value:''};
  }).filter(metric=>metric.label);
}
function legacyTransactions(entity) {
  if (Array.isArray(entity.transactions)) return entity.transactions;
  if (!present(entity.detail)) return [];
  return String(entity.detail).split(/\n+/).map(line=>{
    const text=line.trim();
    const date=text.match(/\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/);
    const direction=text.match(/(转入|转出)/)?.[1] || text.match(/^(首次|最后)/)?.[1] || '';
    if (!date && !direction) return null;
    const amount=text.match(/[¥￥]\s*([\d,.]+(?:\.\d+)?)/)?.[1] || text.match(/(?:转入|转出)[：:]?\s*([\d,.]+(?:\.\d+)?(?:元)?)/)?.[1] || '';
    const remainder=text.replace(date?.[0]||'','').replace(/[·]/g,' ').replace(/[¥￥]\s*[\d,.]+(?:\.\d+)?/,'').trim();
    return {time:fullTime(date?.[0]||''),direction,amount:amount?moneyText(amount):'',attribution:remainder && remainder!==direction ? remainder : ''};
  }).filter(Boolean);
}

/** Maps current business entities to the 21 Figma card types without changing API enums. */
export function investigationTypeFor(entity) {
  const explicit=entity.cardType || entity.clueType;
  if (investigationIcons[explicit]) return explicit;
  const key=entity.id || entity.key;
  if (caseTypeMap[key]) return caseTypeMap[key];
  if (entity.type==='person') return 'person';
  if (entity.type==='bank') return 'fund-bank-l1';
  // Network accounts stay network accounts unless the data adapter provides an explicit payment/fund subtype.
  // Statistics, transaction details and the current analysis scene do not change an entity's business type.
  if (entity.type==='network') return 'net-account';
  const title=String(entity.title || entity.name || '');
  if (/手机号|号码/.test(title)) return categoryFor(entity)==='comm'?'comm-phone':'person-phone';
  if (/银行卡|收款账户|关联账户/.test(title)) return /受害/.test(title)?'victim-bank':'fund-bank-l1';
  if (/微信账号|QQ账号|账号/.test(title)) return categoryFor(entity)==='funds'?'fund-account-l1':'net-account';
  if (/群/.test(title)) return 'net-group';
  if (/域名|网址|URL|IP/.test(title)) return 'net-space';
  if (/APK/.test(title)) return 'net-apk';
  if (/APP/.test(title)) return 'net-app';
  if (/Wi-?Fi/i.test(title)) return 'net-wifi';
  if (/路由/.test(title)) return 'net-router';
  if (/SDK/.test(title)) return 'net-sdk';
  if (/设备|终端/.test(title)) return categoryFor(entity)==='comm'?'comm-device':'net-terminal';
  if (/位置|活动记录/.test(title)) return 'person-location';
  return 'fallback';
}

export function investigationCardModel(entity) {
  const type=investigationTypeFor(entity);
  const lines=legacyLines(entity);
  const isAccount=type.startsWith('fund-account');
  const isBank=type==='victim-bank'||type.startsWith('fund-bank');
  const primary=first(entity.primary,entity.identifierValue,entity.accountId,entity.cardNumber,entity.phone,lines[0],entity.summary);
  const secondary=first(entity.bank,entity.secondary,isBank?lines[1]:'');
  const realName=first(entity.realName,entity.verifiedName,'');
  const nickname=first(entity.nickname,entity.accountNickname,'');
  const owner=first(entity.owner,entity.accountHolder,entity.holder,realName,isBank&&entity.name!==entity.title?entity.name:'');
  const tags=list(first(entity.tags,entity.features));
  const model={
    type,
    category:investigationCategories[type] || categoryFor(entity),
    title:first(entity.cardTitle,entity.title,entity.name,''),
    primary:cleanIdentifier(primary), secondary:cleanIdentifier(secondary), owner:cleanIdentifier(owner),
    nickname:cleanIdentifier(nickname), realName:cleanIdentifier(realName),
    timestamp:first(entity.timestamp,entity.firstContactAt,entity.latestAt,''),
    location:first(entity.location,entity.address,''),
    tags,
    metrics:legacyMetrics(entity), transactions:legacyTransactions(entity),
    manual:Boolean(entity.manual),
    packageName:first(entity.packageName,entity.package,''), md5:first(entity.md5,''),
    url:first(entity.url,type==='net-space'?primary:''), keyName:first(entity.keyName,entity.keyValue,''), company:first(entity.company,''),
    appName:first(entity.appName,type==='net-app'||type==='net-sdk'?primary:''),
    footer:first(entity.footer,(type.startsWith('fund-bank')||type.startsWith('fund-account'))?'查人员位置':''),
    showDetails:entity.showDetails !== false && (type.startsWith('fund-bank')||type.startsWith('fund-account')),
  };
  if ((type==='person-location'||type==='person-device-address'||type==='comm-location') && !model.location) model.location=first(entity.summary,primary,'');
  return model;
}

export function investigationIconFor(entity) {
  const model=investigationCardModel(entity);
  return model.type==='fallback' ? `/assets/figma/entity-node/${model.category}.svg` : `/assets/figma/entity-card/${investigationIcons[model.type]}`;
}

function text(value, className='', title=value) {
  if (!present(value)) return '';
  return `<span${className?` class="${className}"`:''}${present(title)?` title="${esc(title)}"`:''}>${esc(value)}</span>`;
}
function tagsHTML(tags) {
  return tags.length ? `<span class="clue-tags">${tags.map(item=>`<span class="clue-tag" title="${esc(item)}">${esc(item)}</span>`).join('')}</span>` : '';
}
function metricsHTML(metrics, victim=false) {
  if (!metrics.length) return '';
  const count=Math.min(3,metrics.length);
  return `<span class="clue-metrics is-count-${count} ${victim?'is-victim':''}">${metrics.map(metric=>`<span class="clue-metric" title="${esc(`${metric.label}${metric.value||''}`)}"><span>${esc(metric.label)}</span>${present(metric.value)?`<b>${esc(metric.value)}</b>`:''}</span>`).join('')}</span>`;
}
function transactionsHTML(rows) {
  if (!rows.length) return '';
  return `<span class="clue-transactions">${rows.map(row=>`<span class="clue-transaction"><span title="${esc(fullTime(row.time||''))}">${esc(compactTime(row.time||''))}</span><span title="${esc(`${row.direction||''}${row.amount||''}`)}">${esc(row.direction||'')}${row.direction&&row.amount?' ':''}${esc(row.amount||'')}</span><span title="${esc(row.attribution||row.relatedAmount||'')}">${esc(row.attribution||row.relatedAmount||'')}</span></span>`).join('')}</span>`;
}

/** Shared inner content for both case and event investigation maps. */
export function investigationCardBody(entity) {
  const m=investigationCardModel(entity);
  if (m.type==='fallback') return `<span class="clue-primary clue-ellipsis">${esc(first(m.primary,entity.summary,''))}</span>`;
  if (m.type==='person') return `${text(m.primary,'clue-primary clue-ellipsis')}${tagsHTML(m.tags)}`;
  if (m.type==='person-phone'||m.type==='comm-phone') return `<span class="clue-identity clue-phone"><span class="clue-primary clue-ellipsis" title="${esc(m.primary)}">${esc(m.primary)}</span>${text(m.owner,'clue-owner clue-ellipsis')}</span>${text(compactTime(m.timestamp),'clue-time clue-ellipsis',fullTime(m.timestamp))}${tagsHTML(m.tags)}`;
  if (m.type==='person-location'||m.type==='person-device-address'||m.type==='comm-location') return `<span class="clue-location">${text(compactTime(m.timestamp),'clue-time',fullTime(m.timestamp))}${text(m.location,'clue-place clue-ellipsis')}</span>`;
  if (m.type==='comm-device'||m.type==='net-terminal') return `${text(m.primary,'clue-primary clue-ellipsis')}${tagsHTML(m.tags)}`;
  if (m.type==='net-account') {
    const identities=[];
    if (m.nickname && m.nickname!==m.primary) identities.push(`<span><span>昵称</span>${text(m.nickname,'clue-account-value clue-ellipsis')}</span>`);
    if (m.realName && m.realName!==m.primary && m.realName!==m.nickname) identities.push(`<span><span>实名</span>${text(m.realName,'clue-account-value clue-ellipsis')}</span>`);
    return `${text(m.primary,'clue-primary clue-ellipsis')}${identities.length?`<span class="clue-account-identities">${identities.join('')}</span>`:''}`;
  }
  if (m.type==='net-group'||m.type==='net-space'||m.type==='net-wifi'||m.type==='net-router') return text(m.type==='net-space'?first(m.url,m.primary):m.primary,'clue-primary clue-ellipsis');
  if (m.type==='net-app') return `${text(first(m.appName,m.primary),'clue-primary clue-ellipsis')}${text(m.packageName,'clue-meta clue-ellipsis')}${text(m.md5,'clue-meta clue-ellipsis')}`;
  if (m.type==='net-apk') return `${text(first(m.packageName,m.primary),'clue-primary clue-ellipsis')}${text(m.md5,'clue-meta clue-ellipsis')}`;
  if (m.type==='net-sdk') return `${text(first(m.appName,m.primary),'clue-primary clue-ellipsis')}${text(m.url,'clue-meta clue-ellipsis')}${text(m.keyName,'clue-meta clue-ellipsis')}${text(m.company,'clue-meta clue-ellipsis')}`;
  if (m.type==='victim-bank') {
    const firstTransfer=first(entity.firstTransfer,'');
    const lastTransfer=first(entity.lastTransfer,'');
    return `<span class="clue-fund-identity"><span><span class="clue-primary clue-ellipsis" title="${esc(m.primary)}">${esc(m.primary)}</span>${text(m.secondary,'clue-meta clue-ellipsis')}</span><span class="clue-fund-side">${text(m.owner,'clue-owner clue-ellipsis')}</span></span>${metricsHTML(m.metrics,true)}${firstTransfer?`<span class="clue-victim-row"><span>${esc(firstTransfer.label||firstTransfer.time||'')}</span><span>${esc(moneyText(firstTransfer.amount||firstTransfer.value||''))}</span></span>`:''}${lastTransfer?`<span class="clue-victim-row"><span>${esc(lastTransfer.label||lastTransfer.time||'')}</span><span>${esc(moneyText(lastTransfer.amount||lastTransfer.value||''))}</span></span>`:''}${!firstTransfer&&!lastTransfer?transactionsHTML(m.transactions):''}${tagsHTML(m.tags)}`;
  }
  if (isFundType(m.type)) return `<span class="clue-fund-identity"><span><span class="clue-primary clue-ellipsis" title="${esc(m.primary)}">${esc(m.primary)}</span>${text(m.secondary,'clue-meta clue-ellipsis')}</span><span class="clue-fund-side">${text(m.owner,'clue-owner clue-ellipsis')}${m.showDetails?'<span class="clue-details">交易明细</span>':''}</span></span>${metricsHTML(m.metrics)}${transactionsHTML(m.transactions)}${tagsHTML(m.tags)}${m.footer?`<span class="clue-footer"><span>${esc(m.footer.replace(/[›»]+$/,'' ).trim())}</span><span aria-hidden="true">›</span></span>`:''}`;
  return text(m.primary,'clue-primary clue-ellipsis');
}
function isFundType(type) { return type.startsWith('fund-bank')||type.startsWith('fund-account'); }

/** Shared HTML node, used by case graphs, workspace graphs and frozen report previews. */
export function entityNode(entity, {selected=false, menu=false, readonly=false, detailAction='entity', input=true, output=true, iconRenderer=null, variant='default', branchToggle=false, branchCollapsed=false}={}) {
  const id = esc(entity.id || entity.key), category = categoryFor(entity);
  const state = statusNames[entity.state] !== undefined ? entity.state : 'Idle';
  const investigation=variant==='investigation';
  const model=investigation?investigationCardModel(entity):null;
  const title = esc(investigation ? model.title : (entity.title || entity.name));
  const iconCategory=investigation?model.category:category;
  const renderedIcon = investigation ? `<img src="${investigationIconFor(entity)}" alt="">` : iconRenderer ? iconRenderer(category,entity) : `<img src="/assets/figma/entity-node/${category}.svg" alt="">`;
  const menuId=`entity-menu-${id}`;
  const headerMore=investigation&&!readonly?`<button class="node-more clue-more" data-action="node-more" data-id="${id}" aria-label="${title}，更多操作" aria-haspopup="menu" aria-expanded="${menu}" ${menu?`aria-controls="${menuId}"`:''}><img src="/assets/figma/entity-node/more.svg" alt=""></button>`:'';
  const content=investigation?investigationCardBody(entity):`<p title="${esc(entity.summary || entity.role)}">${esc(entity.summary || entity.role || '身份待核验')}</p><div class="entity-provenance"><span>${categories[category]}</span><span title="${esc(entity.provenance || entity.source)}">${esc(entity.provenance || entity.source || '来源待补充')}</span></div>`;
  const menuHTML=!readonly&&state==='Idle'&&menu?`<div id="${menuId}" class="entity-menu" role="menu" aria-label="${title}的实体操作">${btn('查看实体与来源',detailAction,`data-id="${id}" role="menuitem"`,'ghost')}${btn('查看执行记录','node-execution',`data-id="${id}" role="menuitem"`,'ghost')}</div>`:'';
  const legacyActions=!investigation&&!readonly&&state==='Idle'?`<div class="entity-actions" aria-label="${title}的操作">${btn('<img src="/assets/figma/entity-node/details.svg" alt="">查看详情',detailAction,`data-id="${id}"`,'node-action')}<button class="node-more" data-action="node-more" data-id="${id}" aria-label="${title}，更多操作" aria-haspopup="menu" aria-expanded="${menu}" ${menu?`aria-controls="${menuId}"`:''}><img src="/assets/figma/entity-node/more.svg" alt=""></button></div>`:'';
  return `<article class="entity-node ${investigation?'entity-clue-card':''} ${selected?'is-selected':''} ${entity.excluded?'is-excluded':''}" data-node-id="${id}" data-card-type="${esc(model?.type||'')}" data-state="${state}" style="left:${entity.x}px;top:${entity.y}px" ${readonly?'':`tabindex="0" data-action="node-select" data-id="${id}"`} aria-label="${title}${statusNames[state]?'，'+statusNames[state]:''}">
    ${input?'<span class="entity-handle input" aria-hidden="true"><i></i></span>':''}
    <div class="entity-shell"><header class="entity-header"><span class="entity-icon ${iconCategory}">${renderedIcon}</span>
      ${readonly?`<strong class="entity-title">${title}</strong>`:`<button class="entity-title" data-action="${detailAction}" data-id="${id}" title="${title} · 查看详情">${title}</button>`}
      ${investigation&&model.manual&&(model.type==='net-wifi'||model.type==='net-sdk')?'<span class="clue-manual">人工创建</span>':''}
      ${!['Idle','Waiting'].includes(state)?`<img class="entity-status-icon" src="/assets/figma/entity-node/${state.toLowerCase()}.svg" alt="${state==='Success'?'执行成功，不代表证据已核验':statusNames[state]}">`:''}${headerMore}
    </header><div class="entity-content">${content}</div></div>
    ${output?(branchToggle?`<button type="button" class="entity-handle output branch-toggle ${branchCollapsed?'is-collapsed':''}" data-action="node-branch-toggle" data-id="${id}" aria-expanded="${!branchCollapsed}" aria-label="${title}，${branchCollapsed?'展开':'收起'}所有下级卡片"><i></i><span aria-hidden="true">${branchCollapsed?'+':'−'}</span></button>`:'<span class="entity-handle output" aria-hidden="true"><i></i></span>'):''}
    ${legacyActions}${menuHTML}
  </article>`;
}

export function entityGraph(nodes, links, {id='workspace', width=1376, height=534, ui={}, readonly=false, detailAction='entity', iconRenderer=null, variant='default', defaultZoom='fit'}={}) {
  const investigation=variant==='investigation', nodeWidth=investigation?322:242, anchorY=investigation?20:25;
  const collapsed=new Set(Array.isArray(ui.collapsedBranches)?ui.collapsedBranches:Object.keys(ui.collapsedBranches||{}).filter(key=>ui.collapsedBranches[key]));
  const children=new Map();
  links.forEach(link=>{if(!children.has(link.from))children.set(link.from,[]);children.get(link.from).push(link.to);});
  const hidden=new Set();
  const hideDescendants=id=>{for(const child of children.get(id)||[]){if(hidden.has(child))continue;hidden.add(child);hideDescendants(child);}};
  if(investigation) collapsed.forEach(hideDescendants);
  const visibleNodes=nodes.filter(node=>!hidden.has(node.id||node.key));
  const visibleIds=new Set(visibleNodes.map(node=>node.id||node.key));
  const visibleLinks=links.filter(link=>visibleIds.has(link.from)&&visibleIds.has(link.to));
  const positions = Object.fromEntries(visibleNodes.map(n=>[n.id||n.key,n]));
  return `<div class="entity-graph ${readonly?'is-readonly':''} ${investigation?'is-investigation':''}" data-graph="${id}" data-width="${width}" data-height="${height}" data-zoom="${ui.zoom ?? defaultZoom}"><div class="entity-viewport" tabindex="0" aria-label="${readonly?'报告导图预览':'实体关系画布；可滚轮缩放、拖动画布移动视野'}"><div class="entity-extent"><div class="entity-stage" style="width:${width}px;height:${height}px"><svg class="entity-edges" viewBox="0 0 ${width} ${height}" aria-hidden="true">${visibleLinks.map((e,i)=>{
    const a=positions[e.from],b=positions[e.to]; if(!a||!b)return '';
    const x=a.x+nodeWidth,y=a.y+anchorY,tx=b.x,ty=b.y+anchorY;
    const d=e.path || (tx>=x?`M ${x} ${y} C ${x+(tx-x)/2} ${y},${x+(tx-x)/2} ${ty},${tx} ${ty}`:`M ${x} ${y} H ${x+18} V ${Math.max(a.y,b.y)+(investigation?230:145)} H ${tx-18} V ${ty} H ${tx}`);
    return `<path d="${d}" class="${e.running?'running':''} ${e.inferred?'inferred':''}"/>${e.label?`<text x="${e.labelX ?? (x+tx)/2}" y="${e.labelY ?? Math.min(y,ty)-16}" text-anchor="middle">${esc(e.label)}</text>`:''}`;
  }).join('')}</svg>${visibleNodes.map(n=>{const nodeId=n.id||n.key;return entityNode(n,{selected:ui.selected===nodeId,menu:ui.menu===nodeId,readonly,detailAction,input:visibleLinks.some(e=>e.to===nodeId),output:children.has(nodeId),branchToggle:investigation&&!readonly&&children.has(nodeId),branchCollapsed:collapsed.has(nodeId),iconRenderer,variant});}).join('')}</div></div></div></div>`;
}

/** Native scrolling and a fitted transform keep nodes readable without changing their design dimensions. */
export function graphZoomPercent(scale) { return `${Math.round(Number(scale || 1) * 100)}%`; }

function updateEntityGraphZoomLabel(graph,scale) {
  const label=graphZoomPercent(scale),scope=graph.closest('.cd-graph-canvas')||graph.parentElement;
  scope?.querySelectorAll('[data-graph-zoom-label]').forEach(control=>{
    if(control.dataset.graphZoomLabel!==graph.dataset.graph)return;
    control.textContent=label;
    control.setAttribute('aria-label',`当前缩放 ${label}；点击恢复 100%`);
    control.title=`当前缩放 ${label}；点击恢复 100%`;
  });
}

export function applyEntityGraphScale(graph, requestedScale) {
  const viewport=graph?.querySelector('.entity-viewport'), stage=graph?.querySelector('.entity-stage'), extent=graph?.querySelector('.entity-extent');
  if(!viewport||!stage||!extent)return 1;
  const width=Number(graph.dataset.width),height=Number(graph.dataset.height);
  const fit=Math.min(1,viewport.clientWidth/width,graph.closest('.cd-detail')?viewport.clientHeight/height:1);
  const scale=requestedScale==='fit'||requestedScale===undefined?Math.max(graph.classList.contains('is-readonly')?.12:.55,fit):Math.max(.35,Math.min(1.5,Number(requestedScale)||1));
  stage.style.transform=`scale(${scale})`;extent.style.width=`${width*scale}px`;extent.style.height=`${height*scale}px`;graph.dataset.scale=String(scale);
  updateEntityGraphZoomLabel(graph,scale);
  return scale;
}

/** Native scrolling and a fitted transform keep nodes readable without changing their design dimensions. */
export function fitEntityGraphs(root=document) {
  root.querySelectorAll('.entity-graph').forEach(graph=>applyEntityGraphScale(graph,graph.dataset.zoom));
}

/** Installs Dify-style wheel zoom and blank-canvas pointer panning on investigation graphs. */
export function installEntityGraphInteractions(root=document,{onZoom}={}) {
  root.querySelectorAll('.entity-graph.is-investigation:not(.is-readonly) .entity-viewport').forEach(viewport=>{
    if(viewport.dataset.graphInteractions==='1')return;
    viewport.dataset.graphInteractions='1';
    viewport.addEventListener('wheel',event=>{
      event.preventDefault();
      const graph=viewport.closest('.entity-graph'),oldScale=Number(graph.dataset.scale||1);
      const next=Math.max(.35,Math.min(1.5,oldScale*(event.deltaY<0?1.1:.9)));
      const rect=viewport.getBoundingClientRect(),pointerX=event.clientX-rect.left,pointerY=event.clientY-rect.top;
      const contentX=(viewport.scrollLeft+pointerX)/oldScale,contentY=(viewport.scrollTop+pointerY)/oldScale;
      applyEntityGraphScale(graph,next);
      viewport.scrollLeft=contentX*next-pointerX;viewport.scrollTop=contentY*next-pointerY;
      graph.dataset.zoom=String(next);onZoom?.({id:graph.dataset.graph,zoom:next});
    },{passive:false});
    let drag=null;
    viewport.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('button,.entity-node,.entity-menu'))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
      viewport.classList.add('is-panning');viewport.setPointerCapture(event.pointerId);event.preventDefault();
    });
    viewport.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;viewport.scrollLeft=drag.left-(event.clientX-drag.x);viewport.scrollTop=drag.top-(event.clientY-drag.y);});
    const stop=event=>{if(!drag||drag.id!==event.pointerId)return;drag=null;viewport.classList.remove('is-panning');};
    viewport.addEventListener('pointerup',stop);viewport.addEventListener('pointercancel',stop);
  });
}
