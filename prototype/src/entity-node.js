import {esc, btn} from './ui.js';

export const categories = {
  funds: '资金流', comm: '通讯流', net: '网络流', person: '人员流', case: '案件',
};
const statusNames = {Idle:'', Running:'运行中', Paused:'已暂停', Success:'执行成功', Error:'执行失败', Exception:'执行异常', Waiting:'等待执行'};
export function categoryFor(entity) {
  return entity.icon || ({账户:'funds',商户:'funds',号码:'comm',通讯:'comm',网络:'net',设备:'net',案件:'case'}[entity.type] || 'person');
}

/** Shared HTML node, used by case graphs, workspace graphs and frozen report previews. */
export function entityNode(entity, {selected=false, menu=false, readonly=false, detailAction='entity', input=true, output=true}={}) {
  const id = esc(entity.id || entity.key), category = categoryFor(entity);
  const state = statusNames[entity.state] !== undefined ? entity.state : 'Idle';
  const title = esc(entity.title || entity.name);
  return `<article class="entity-node ${selected?'is-selected':''} ${entity.excluded?'is-excluded':''}" data-node-id="${id}" data-state="${state}" style="left:${entity.x}px;top:${entity.y}px" ${readonly?'':`tabindex="0" data-action="node-select" data-id="${id}"`} aria-label="${title}${statusNames[state]?'，'+statusNames[state]:''}">
    ${input?'<span class="entity-handle input" aria-hidden="true"><i></i></span>':''}
    <div class="entity-shell"><header class="entity-header"><span class="entity-icon ${category}"><img src="/assets/figma/entity-node/${category}.svg" alt=""></span>
      ${readonly?`<strong class="entity-title">${title}</strong>`:`<button class="entity-title" data-action="${detailAction}" data-id="${id}" title="${title} · 查看详情">${title}</button>`}
      ${!['Idle','Waiting'].includes(state)?`<img class="entity-status-icon" src="/assets/figma/entity-node/${state.toLowerCase()}.svg" alt="${state==='Success'?'执行成功，不代表证据已核验':statusNames[state]}">`:''}
    </header><div class="entity-content"><p title="${esc(entity.summary || entity.role)}">${esc(entity.summary || entity.role || '身份待核验')}</p><div class="entity-provenance"><span>${categories[category]}</span><span title="${esc(entity.provenance || entity.source)}">${esc(entity.provenance || entity.source || '来源待补充')}</span></div></div></div>
    ${output?'<span class="entity-handle output" aria-hidden="true"><i></i></span>':''}
    ${!readonly&&state==='Idle'?`<div class="entity-actions" aria-label="${title}的操作">${btn('<img src="/assets/figma/entity-node/details.svg" alt="">查看详情',detailAction,`data-id="${id}"`,'node-action')}<button class="node-more" data-action="node-more" data-id="${id}" aria-label="${title}，更多操作" aria-expanded="${menu}"><img src="/assets/figma/entity-node/more.svg" alt=""></button></div>${menu?`<div class="entity-menu" aria-label="实体操作">${btn('查看实体与来源',detailAction,`data-id="${id}"`,'ghost')}${btn('查看执行记录','node-execution',`data-id="${id}"`,'ghost')}</div>`:''}`:''}
  </article>`;
}

export function entityGraph(nodes, links, {id='workspace', width=1376, height=534, ui={}, readonly=false, detailAction='entity'}={}) {
  const positions = Object.fromEntries(nodes.map(n=>[n.id||n.key,n]));
  return `<div class="entity-graph ${readonly?'is-readonly':''}" data-graph="${id}" data-width="${width}" data-height="${height}" data-zoom="${ui.zoom||'fit'}"><div class="entity-viewport" tabindex="0" aria-label="${readonly?'报告导图预览':'实体关系画布，可横向滚动；选择节点查看来源'}"><div class="entity-extent"><div class="entity-stage" style="width:${width}px;height:${height}px"><svg class="entity-edges" viewBox="0 0 ${width} ${height}" aria-hidden="true">${links.map((e,i)=>{
    const a=positions[e.from],b=positions[e.to]; if(!a||!b)return '';
    const x=a.x+242,y=a.y+25,tx=b.x,ty=b.y+25;
    const d=e.path || (tx>=x?`M ${x} ${y} C ${x+(tx-x)/2} ${y},${x+(tx-x)/2} ${ty},${tx} ${ty}`:`M ${x} ${y} H ${x+18} V ${Math.max(a.y,b.y)+145} H ${tx-18} V ${ty} H ${tx}`);
    return `<path d="${d}" class="${e.running?'running':''} ${e.inferred?'inferred':''}"/>${e.label?`<text x="${e.labelX ?? (x+tx)/2}" y="${e.labelY ?? Math.min(y,ty)-16}" text-anchor="middle">${esc(e.label)}</text>`:''}`;
  }).join('')}</svg>${nodes.map(n=>entityNode(n,{selected:ui.selected===(n.id||n.key),menu:ui.menu===(n.id||n.key),readonly,detailAction,input:links.some(e=>e.to===(n.id||n.key)),output:links.some(e=>e.from===(n.id||n.key))})).join('')}</div></div></div></div>`;
}

/** Native scrolling and a fitted transform keep nodes readable without changing their design dimensions. */
export function fitEntityGraphs(root=document) {
  root.querySelectorAll('.entity-graph').forEach(graph=>{
    const viewport=graph.querySelector('.entity-viewport'), stage=graph.querySelector('.entity-stage'), extent=graph.querySelector('.entity-extent');
    const width=Number(graph.dataset.width), height=Number(graph.dataset.height);
    const fit = Math.min(1,viewport.clientWidth/width,graph.closest('.cd-detail')?viewport.clientHeight/height:1);
    const scale = graph.dataset.zoom==='fit' ? Math.max(graph.classList.contains('is-readonly')?.12:.55,fit) : Math.max(.35,Math.min(1.5,Number(graph.dataset.zoom)));
    stage.style.transform=`scale(${scale})`; extent.style.width=`${width*scale}px`; extent.style.height=`${height*scale}px`;
    graph.dataset.scale=scale;
  });
}
