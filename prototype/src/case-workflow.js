import {renderCaseDetail,installCaseDetail} from './case-detail.js';
import {state, uid, now, log} from './state.js';
import {esc, btn, link, tag, field, select, area, check, note, table, empty} from './ui.js';
import {entityGraph, categories} from './entity-node.js';
import {caseEntities, caseLinks} from './case-entities.js';

export const caseSteps = ['案情解析','现勘解析','笔录解析','侦查导图','AI报告'];
const demoTexts = [
  '【合成案情】受害人甲通过示例投资平台与对方联系，按要求从银行卡尾号1028分三笔转出共128,000元，收款账户尾号6071。对方使用号码138****0712，并通过账号 invest_demo 与域名 demo.invalid 保持联系。原文实体为待核验线索。',
  '【合成现勘】示例设备 DEMO-01 的材料中出现通讯账号 demo_A、号码尾号0712与收款账户尾号6071；记录含示例 IP 192.0.2.10、账号 invest_demo、关联账户3359、交易记录 T-01 / T-02 和通联记录 C-01。设备与人员对应关系尚未核验。',
  '【合成笔录】受害人甲陈述其从尾号1028账户向尾号6071账户转款，联系号码0712与账号 invest_demo，另提及支付账号 P-01、号码8890和关联人员B。多个来源中的相同标识可形成合并候选；陈述不等于已核实事实。',
];
export function selectedCase() {return state.cases.find(c=>c.id===state.selectedCase)||state.cases[0];}
export function caseFlow(c=selectedCase()) {
  if(!c)return null;
  state.caseFlows ||= {};
  return state.caseFlows[c.id] ||= {step:0,materials:demoTexts.map((text,i)=>({name:['案情摘录_示例.txt','现勘记录_示例.txt','询问笔录_示例.txt'][i],text,demo:true,status:'待解析'})),run:'Idle',tick:0,events:[],view:'focus',reportId:null};
}
const listConfig=()=>state.caseList ||= {tab:'all',status:'全部状态',sort:'desc',columns:['status','notes','forensic','results','owner'],saved:null};
export function caseListPage() {
  const config=listConfig();
  const rows=state.cases.filter(c=>(!state.caseFilter||`${c.name} ${c.number} ${c.description||''}`.includes(state.caseFilter))&&(config.tab!=='favorite'||c.favorite)&&(config.tab!=='yesterday'||c.updated===yesterday())&&(config.status==='全部状态'||c.status===config.status)).sort((a,b)=>config.sort==='desc'?b.updated.localeCompare(a.updated):a.updated.localeCompare(b.updated));
  const columns=[['status','研判状态'],['notes','笔录数'],['forensic','现勘数'],['results','研判结果'],['owner','立案单位'],['amount','损失金额'],['category','案件类型']].filter(([key])=>config.columns.includes(key));
  return `<div class="case-page-heading"><div><h1>个案研判</h1><p>从案件资料出发，关联线索、自动研判并形成报告。</p></div>${btn('流程说明','case-help','','ghost')}</div><section class="case-list-panel"><nav class="case-list-tabs" aria-label="案件视图">${[['yesterday','昨日案件'],['all','全部案件'],['favorite','重点关注']].map(([id,label])=>`<button data-action="case-tab" data-tab="${id}" class="${config.tab===id?'active':''}" aria-pressed="${config.tab===id}">${label}</button>`).join('')}</nav><div class="case-list-controls"><div class="actions">${btn('新增案件','case-create','','primary','plus')}${btn('批量导入','case-import')}</div><form id="case-filter" class="case-search-form"><input type="search" name="query" value="${esc(state.caseFilter||'')}" aria-label="搜索案件名称、编号、简要案情" placeholder="搜索案件名称、编号、简要案情"><button class="btn" type="submit">搜索</button>${btn('筛选','case-filters')}${btn('重置','clear-case-filter')}${btn('保存','case-save-view')}${btn(config.sort==='desc'?'排序 ↓':'排序 ↑','case-sort')}${btn('显示列','case-columns')}</form></div><div class="case-list-caption"><span>案件标识与操作固定 · 表格可横向滚动查看字段</span><span>${config.status!=='全部状态'?esc(config.status)+' · ':''}${rows.length} 条合成记录</span></div><div class="case-table-scroll"><table class="case-table"><thead><tr><th aria-label="关注"></th><th>序号</th><th class="case-name-cell">案件名称/编号</th>${columns.map(([,name])=>`<th>${name}</th>`).join('')}<th class="case-operations">操作</th></tr></thead><tbody>${rows.map((c,index)=>{
    const f=state.caseFlows?.[c.id];const values={status:tag(c.status,c.status==='已完成'?'success':c.status==='待核验'?'warning':''),notes:c.notesCount??(f?.materials[2].status!=='待解析'&&f?1:0),forensic:c.forensicCount??(f?.materials[1].status!=='待解析'&&f?1:0),results:`<div class="case-results">${[['person','人',f?.run==='Success'?(f.detail?.entities||caseEntities).filter(n=>(n.icon||n.category)==='person').length:0],['funds','卡',f?.run==='Success'?(f.detail?.entities||caseEntities).filter(n=>(n.icon||n.category)==='funds').length:0],['comm','话',f?.run==='Success'?(f.detail?.entities||caseEntities).filter(n=>(n.icon||n.category)==='comm').length:0],['net','网',f?.run==='Success'?(f.detail?.entities||caseEntities).filter(n=>(n.icon||n.category)==='net').length:0]].map(([color,label,n])=>`<span class="business-tag ${color}">${label} ${n}</span>`).join('')}</div>`,owner:esc(c.owner),amount:c.amount?'¥'+Number(c.amount).toLocaleString():'—',category:esc(c.category)};
    return `<tr><td><button class="case-favorite" data-action="case-favorite" data-id="${esc(c.id)}" aria-pressed="${!!c.favorite}" aria-label="${c.favorite?'取消关注':'关注'} ${esc(c.name)}">${c.favorite?'★':'☆'}</button></td><td>${index+1}</td><td class="case-name-cell"><button class="case-title-link" data-action="open-case" data-id="${esc(c.id)}">${esc(c.name)}</button><small>${esc(c.number)}</small></td>${columns.map(([key])=>`<td>${values[key]}</td>`).join('')}<td class="case-operations"><div class="actions">${btn('编辑','case-edit',`data-id="${esc(c.id)}"`,'text')}${btn('删除','case-delete',`data-id="${esc(c.id)}"`,'text')}</div><div class="actions">${btn('导入报告','case-upload-report',`data-id="${esc(c.id)}"`,'text')}${btn('查看报告','case-view-report',`data-id="${esc(c.id)}"`,'text')}</div></td></tr>`;
  }).join('')}</tbody></table></div>${!rows.length?empty('没有符合条件的案件','尝试清除搜索条件，或切换到全部案件。',btn('清空筛选','clear-case-filter')):''}<footer class="case-list-caption"><span>仅本地合成记录 · 不写回正式案件系统</span><span>共 ${rows.length} 条 · 当前全部展示</span></footer></section>`;
}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

export function casePage() {
  const c=selectedCase();
  return c?renderCaseDetail(c,caseFlow(c)):empty('暂无案件','请先创建一条合成案件记录。',link('返回案件列表','PG12','btn'));
}

function materialPage(c,flow,index) {
  const material=flow.materials[index],done=material.status==='已解析';
  const keys=[['b1028','phone','net'],['b6071','comm','device'],['victim','b3359','p8890']][index];
  return `<div class="case-material-layout"><section class="case-card"><div class="case-card-heading"><h2>${done?caseSteps[index]+'结果':'导入'+caseSteps[index].slice(0,2)+'材料'}</h2>${tag(material.status,done?'success':'warning')}</div><form id="case-material-form"><input type="hidden" name="step" value="${index}">${field('材料名称','name',material.name,'text','required maxlength="120"')}${area('原文内容（仅合成数据）','text',material.text,'required maxlength="20000" rows="9"')}<p class="small muted">支持本地 TXT（≤2MB）；不支持 PDF / OCR。自定义文本只保存原文，不伪造实体提取结果。</p><div class="actions material-actions"><label class="btn">选择 TXT<input type="file" id="case-material-file" accept=".txt,text/plain" class="visually-hidden"></label>${btn('填入合成示例','case-material-demo',`data-step="${index}"`)}<button type="submit" class="btn primary">${material.demo?'保存并模拟解析':'保存原文'}</button></div><div class="form-error" role="alert"></div></form>${done?`<div class="case-source-note">${material.demo?'模拟解析完成 · 结果仅来自内置合成示例，不是真实模型提取。':'原文已保存；未接入解析服务，暂无结构化实体。'}</div>`:''}</section><aside class="case-card"><div class="case-card-heading"><h2>实体线索</h2>${tag(done&&material.demo?'合成示例':'待解析')}</div>${done&&material.demo?keys.map(key=>{
    const entity=caseEntities.find(n=>n.key===key);return `<button class="material-entity ${entity.icon}" data-action="case-node-detail" data-id="${key}"><div><span class="business-tag ${entity.icon}">${entity.category}</span><small>${caseSteps[index].slice(0,2)}</small></div><strong>${esc(entity.title)}</strong><p>${esc(entity.summary)}</p></button>`;
  }).join('')+btn('查看来源与合并示例','case-dedup','','secondary'):empty('暂无实体线索',material.demo?'保存并模拟解析后，展示带来源的实体线索。':'自定义原文未解析；可以查看原文，或填入合成示例体验后续流程。')}<div class="case-source-note">原文、推断和人工补充分开呈现；解析成功不代表内容已经核实。</div></aside></div><footer class="case-stage-actions"><span>${done?'已保存本步骤，可随时补充材料':'先确认材料，再进入下一步'}</span>${btn('下一步：'+caseSteps[index+1]+' →','case-stage',`data-step="${index+1}" ${done?'':'disabled'}`,'primary')}</footer>`;
}
export function caseGraphData(c,flow,view=flow.view) {
  const done=flow.run==='Success', live=['Running','Paused','Error','Exception','Waiting'].includes(flow.run);
  const materialKeys=caseEntities.filter(n=>!n.provenance.includes('自动研判')).map(n=>n.key);
  let nodes,links,width,height;
  const root={id:'case',key:'case',title:c.name,summary:`三类材料 · ${materialKeys.length}个原始实体`,provenance:'来源：案情 / 现勘 / 笔录',icon:'case',state:'Idle'};
  if(view==='focus') {
    const keys=['b1028','b6071','phone','comm','net','device',...(live||done?['persona','locp']:[])];
    const pos=[[272,60],[546,60],[272,218],[546,218],[272,376],[546,376],[820,218],[1094,218]];
    nodes=keys.map((key,i)=>({...caseEntities.find(n=>n.key===key),id:key,x:pos[i][0],y:pos[i][1],state:key==='locp'?(done?'Success':flow.run):'Idle'}));
    if(live){const location=nodes.at(-1);location.title='活动记录查询';location.summary=({Paused:'已暂停，保留已完成节点',Error:'模拟来源超时，可局部重试',Exception:'部分来源不可用，需显式重试',Waiting:'等待演示授权，不执行查询'})[flow.run]||'正在扩展位置线索…';}
    nodes.unshift({...root,x:24,y:218});
    links=[['case','b1028',''],['case','phone',''],['case','net',''],['b1028','b6071','涉案转账'],['phone','comm','账号关联'],['net','device','设备活动'],...(live||done?[['b6071','persona',''],['comm','persona','主体关联'],['device','persona',''],['persona','locp','位置研判']]:[])].map(([from,to,label])=>({from,to,label,running:to==='locp'&&flow.run==='Running'}));
    width=1376;height=534;
  } else {
    nodes=caseEntities.filter(n=>(view==='material'||!done)?materialKeys.includes(n.key):true).map(n=>({...n,id:n.key,x:n.x+24,state:'Idle'}));nodes.unshift({...root,x:24,y:770});
    links=caseLinks.filter(e=>nodes.some(n=>n.key===e.from)&&nodes.some(n=>n.key===e.to)).map(e=>({...e}));
    // Long cross-row edges travel through empty gutters, never through entity bodies.
    const routes={
      'b1028/victim':{path:'M 536 95 H 554 V 1340 H 274 V 1455 H 294',labelX:400,labelY:1325},
      'b3359/personb':{path:'M 536 295 H 578 V 1455 H 604',labelX:550,labelY:1290},
      'b6071/persona':{path:'M 846 95 H 876 V 440 H 1490 V 795 H 1534',labelX:1100,labelY:425},
      'dev2/persona':{path:'M 1776 1095 H 1808 V 1260 H 1502 V 795 H 1534',labelX:1640,labelY:1245},
    };
    links.forEach(e=>Object.assign(e,routes[e.from+'/'+e.to]||{}));width=2420;height=1620;
  }
  return {nodes,links,width,height};
}
function caseGraphPage(c,flow) {
  const ready=flow.materials.every(m=>m.status==='已解析'&&m.demo),data=caseGraphData(c,flow),ui=state.graphUI?.case||{};
  const runCopy={Idle:'三类材料已归集 · 先核对来源，再开始本轮研判',Running:'本轮模拟研判中 · 多流线索持续关联',Paused:'本轮研判已暂停 · 已完成节点与来源保留',Success:'本轮模拟研判完成 · 新增9个实体 · 已形成位置候选',Error:'模拟数据源超时 · 已完成结果保留，请局部重试',Waiting:'等待演示授权确认 · 不会自动恢复',Exception:'部分来源不可用 · 请核对缺口'};
  return `<section class="case-graph-panel"><div class="case-graph-toolbar"><strong>侦查导图</strong><div class="actions">${[['focus','聚焦视图'],['full','全图概览'],['material','材料实体 16']].map(([view,label])=>btn(label,'case-graph-view',`data-view="${view}" aria-pressed="${flow.view===view}"`,flow.view===view?'selected small':'ghost small')).join('')}</div><div class="case-legend">${Object.entries(categories).filter(([key])=>key!=='case').map(([key,label])=>`<span class="business-tag ${key}">${label}</span>`).join('')}</div>${btn('执行记录','case-execution','','ghost small')}</div><div class="case-run-banner ${flow.run.toLowerCase()}" role="status"><span>${ready?runCopy[flow.run]:'三类示例材料尚未完成解析；当前仅为示例结构预览，不代表本案已提取结果。'}</span><div class="actions">${flow.run==='Idle'?btn('开始模拟研判','case-run',ready?'':'disabled','primary small'):flow.run==='Running'?btn('暂停研判','case-pause','','small'):[ 'Paused','Error','Waiting','Exception'].includes(flow.run)?btn(flow.run==='Error'?'局部重试':'检查并恢复','case-resume','','primary small'):btn('查看位置结论','case-node-detail','data-id="locp"','primary small')}${flow.run==='Running'?btn('推进一步','case-advance','','small'):''}</div></div>${entityGraph(data.nodes,data.links,{...data,id:'case',ui,detailAction:'case-node-detail'})}<footer class="case-graph-footer"><span>${flow.run==='Success'?'全案25个实体（16原始 + 9新增）':'材料实体16个 · 结果尚未完成'} · ${flow.view==='focus'?'当前聚焦关键线索':'来源、推断与历史活动分别保留'}</span><div class="actions">${btn('−','node-zoom','data-graph-id="case" data-delta="-.15" aria-label="缩小导图"','ghost small')}${btn('适应画布','node-fit','data-graph-id="case"','ghost small')}${btn('+','node-zoom','data-graph-id="case" data-delta=".15" aria-label="放大导图"','ghost small')}</div><span class="small muted">图标色=类别 / 边框=状态 / 位置非实时定位</span></footer></section><footer class="case-stage-actions"><span>${flow.run==='Success'?'位置候选已形成；身份关联与时效仍需核验':'完成模拟研判后才可生成本轮报告'}</span>${btn('下一步：生成AI报告 →','case-generate-report',flow.run==='Success'?'':'disabled','primary')}</footer>`;
}
export function caseReportPreview(report) {
  if(!report?.graphSnapshot)return '';
  const data=report.graphSnapshot;
  return `<section class="case-card report-graph-preview"><div class="case-card-heading"><h2>侦查导图 · 报告冻结快照</h2>${tag('v'+(report.graphVersion||1))}</div>${entityGraph(data.nodes,data.links,{...data,id:'report-'+report.id,readonly:true})}<p class="small muted">当前报告保存时的图谱；实时研判不会静默改写该快照。</p>${btn('返回案件导图','case-report-graph',`data-case-id="${esc(report.caseId)}"`,'small')}</section>`;
}
function caseReportPage(c,flow) {
  const r=state.reports.find(r=>r.id===flow.reportId);
  if(!r)return `<section class="case-card">${empty('尚未生成本轮报告','完成材料解析与本轮研判后，生成带来源和图谱快照的报告。',btn('返回侦查导图','case-stage','data-step="3"','primary'))}</section>`;
  return `<div class="case-report-layout"><section class="case-card"><div class="case-card-heading"><h2>${esc(r.title)}</h2>${tag(r.status)}${tag('v'+r.version)}</div><pre class="case-report-text">${esc(r.content)}</pre></section><aside>${caseReportPreview(r)}<section class="case-card"><h2>报告核验</h2><p>事实、推断和数据缺口分开披露。执行完成不代表人工复核通过。</p><div class="actions material-actions">${btn('编辑与核验','case-report-edit','','primary')}${btn('复核与导出','case-report-review')}</div></section></aside></div><footer class="case-stage-actions"><span>报告保留独立版本 · 不自动写回正式案件</span>${btn('重新生成草稿','case-generate-report','','secondary')}</footer>`;
}

export function installCaseWorkflow({actions,forms,go,commit,toast,modal,formModal,confirm,ensureBusiness,download}) {
  const guard=()=>{ensureBusiness();if(!selectedCase())throw Error('案件不存在，请返回案件列表。');};
  const changeStep=step=>{guard();const flow=caseFlow();if(step<0||step>4)return;go('PG13',()=>{flow.step=step;});};
  const editCase=(c=null)=>formModal(c?'编辑本地案件':'新增合成案件',note('只创建本地研判引用，不创建或修改正式案件。')+field('案件名称','name',c?.name||'','text','required maxlength="100"')+field('案件编号','number',c?.number||'','text','required maxlength="60"')+field('立案单位','owner',c?.owner||'示例分局 · 刑侦大队','text','required maxlength="80"')+select('案件类型','category',['涉网线索','资金线索','其他线索'],c?.category||'涉网线索'),f=>{ensureBusiness();const fields=Object.fromEntries([...f].map(([key,value])=>[key,value.trim()]));for(const key of ['name','number','owner'])if(!fields[key].trim())throw Error('必填字段不能仅为空格。');if(state.cases.some(item=>item.id!==c?.id&&item.number===fields.number.trim()))throw Error('案件编号已存在，请检查重复记录。');if(c)Object.assign(c,fields,{updated:new Date().toLocaleDateString('sv-SE')});else state.cases.unshift({...fields,id:uid('CASE'),status:'待研判',updated:new Date().toLocaleDateString('sv-SE'),members:[state.user],reports:[]});commit('本地案件已保存。');return true;});
  const findCase=el=>{const c=state.cases.find(c=>c.id===el.dataset.id);if(!c)throw Error('案件不存在');return c;};
  Object.assign(actions,{
    'case-help':()=>modal('五步研判流程',note('案情解析 → 现勘解析 → 笔录解析 → 侦查导图 → AI报告。材料与结果保留在各自案件中，切换页面不会重复执行。')+note('所有分析是本地合成示例。TXT原文可以保存，PDF/OCR、真实解析、位置查询、生产授权均未接入。','warning')),
    'case-tab':el=>{listConfig().tab=el.dataset.tab;commit();},
    'clear-case-filter':()=>{state.caseFilter='';listConfig().status='全部状态';listConfig().tab='all';commit();},
    'case-sort':()=>{const c=listConfig();c.sort=c.sort==='desc'?'asc':'desc';commit();},
    'case-favorite':el=>{ensureBusiness();const c=findCase(el);c.favorite=!c.favorite;commit();},
    'case-filters':()=>formModal('筛选案件',select('研判状态','status',['全部状态','待研判','研判中','待核验','已完成','待补充'],listConfig().status),f=>{listConfig().status=f.get('status');commit();return true;}),
    'case-columns':()=>formModal('显示列',note('案件名称 / 编号、关注与操作列固定保留。')+[['status','研判状态'],['notes','笔录数'],['forensic','现勘数'],['results','研判结果'],['owner','立案单位'],['amount','损失金额'],['category','案件类型']].map(([key,label])=>check(label,'columns',listConfig().columns.includes(key),`value="${key}"`)).join(''),f=>{listConfig().columns=f.getAll('columns');commit('显示列已更新。');return true;}),
    'case-save-view':()=>{const c=listConfig();c.saved={tab:c.tab,status:c.status,sort:c.sort,columns:[...c.columns],query:state.caseFilter||''};commit('当前视图已保存到本机，刷新后保留。');},
    'case-create':()=>{ensureBusiness();editCase();},'case-edit':el=>{ensureBusiness();editCase(findCase(el));},
    'case-delete':el=>{ensureBusiness();const c=findCase(el);confirm('删除本地案件引用？',`将移除“${c.name}”的本地引用与本地研判流程，独立报告和历史搜索不删除，不影响任何正式案件。`,()=>{ensureBusiness();state.cases=state.cases.filter(x=>x.id!==c.id);if(state.caseFlows)delete state.caseFlows[c.id];if(state.selectedCase===c.id)state.selectedCase=state.cases[0]?.id;if(state.caseId===c.id)state.caseId=null;commit('本地引用已删除，历史独立产物保留。');},'删除本地引用');},
    'case-import':()=>{ensureBusiness();formModal('批量导入合成案件',note('粘贴 JSON 数组，每条包含 name、number，可选 owner。仅导入本地引用，最多50条；重复编号整批拒绝。')+area('JSON数据','rows','[{"name":"合成示例案件","number":"DEMO-2026-01","owner":"示例一组"}]','required rows="8"'),f=>{ensureBusiness();let rows;try{rows=JSON.parse(f.get('rows'));}catch{throw Error('JSON格式不正确');}if(!Array.isArray(rows)||!rows.length||rows.length>50)throw Error('请提供1–50条案件');const seen=new Set(state.cases.map(c=>c.number));for(const r of rows){if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>100||typeof r.number!=='string'||!r.number.trim()||r.number.length>60||(r.owner!==undefined&&(typeof r.owner!=='string'||r.owner.length>80)))throw Error('案件名称、编号或单位格式不正确');if(seen.has(r.number.trim()))throw Error('存在重复编号：'+r.number);seen.add(r.number.trim());}state.cases.push(...rows.map(r=>({id:uid('CASE'),name:r.name.trim(),number:r.number.trim(),owner:r.owner||'示例一组',category:'其他线索',status:'待研判',updated:new Date().toLocaleDateString('sv-SE'),members:[state.user],reports:[]})));commit('已导入'+rows.length+'条本地引用。');return true;},'导入');},
    'case-stage':el=>changeStep(Number(el.dataset.step)),
    'case-material-demo':el=>{guard();confirm('替换为合成示例？','将替换当前材料并清除本轮执行状态；已生成报告的冻结快照保留。',()=>{guard();const i=Number(el.dataset.step);const m=caseFlow().materials[i];m.text=demoTexts[i];m.name=['案情摘录_示例.txt','现勘记录_示例.txt','询问笔录_示例.txt'][i];m.demo=true;m.status='待解析';invalidateCaseRun(caseFlow());commit('已填入合成示例，请保存并模拟解析。');},'替换材料');},
    'case-dedup':()=>modal('跨来源合并与冲突保留',table(['稳定标识','来源','处理'],[['账户尾号6071','案情 / 现勘 / 笔录','同一合成标识，仅示例合并；尾号不构成真实唯一身份'],['号码0712','案情 / 现勘','来源并列保留，身份待核验'],['账号 invest_demo','案情 / 笔录','保留大小写，不与同名账号自动合并']])+note('此处为合并规则示例，不对自定义上传材料进行真实身份消歧。','warning')),
    'case-graph-view':el=>{guard();caseFlow().view=el.dataset.view;state.graphUI ||= {};state.graphUI.case={zoom:'fit'};commit();},
    'case-run':()=>{guard();const f=caseFlow();if(!f.materials.every(m=>m.status==='已解析'&&m.demo))throw Error('请先完成三类合成示例材料解析。');if(f.run!=='Idle')throw Error('本轮任务已开始，不重复执行。');if(!state.network)throw Error('当前模拟断线，请恢复连接后重试。');f.run='Running';f.tick=0;f.events.push({title:'启动本轮模拟研判',time:now(),status:'运行中'});selectedCase().status='研判中';commit('已启动本地模拟；可手动推进，或开启演示自动推进。');},
    'case-advance':()=>{guard();advanceCaseFlow(caseFlow());commit();},
    'case-pause':()=>{guard();const f=caseFlow();if(f.run!=='Running')throw Error('当前任务未运行');f.run='Paused';f.events.push({title:'用户暂停，已完成结果保留',time:now(),status:'已暂停'});commit('已暂停，不重放已完成动作。');},
    'case-resume':()=>{guard();const f=caseFlow();if(!['Paused','Error','Waiting','Exception'].includes(f.run))throw Error('当前状态不能恢复');if(!state.network)throw Error('当前模拟断线，不能恢复');f.retried=true;f.authorized=true;f.run='Running';f.events.push({title:'检查条件后显式恢复',time:now(),status:'运行中'});commit('从保留的步骤继续。');},
    'case-execution':()=>{guard();const f=caseFlow();modal('本轮执行记录',f.events.length?table(['时间','动作','状态'],f.events.map(e=>[esc(e.time),esc(e.title),tag(e.status)])):empty('尚未开始本轮研判','先完成材料解析，再开始模拟研判。'));},
    'case-node-detail':el=>{guard();const key=el.dataset.id;if(key==='case'){changeStep(0);return;}const entity=caseEntities.find(n=>n.key===key);if(!entity)throw Error('实体不存在');const f=caseFlow();if(key==='locp'&&f.run!=='Success'){actions['case-execution']();return;}modal(entity.title,`<div class="case-detail-category"><span class="business-tag ${entity.icon}">${entity.category}</span>${tag('待核验','warning')}</div><h3>${esc(entity.summary)}</h3><p class="inset">${esc(entity.provenance)}</p>${key.startsWith('loc')?note('观测时点：2026-09-12 14:20（示例）。这是历史观测形成的位置候选，不是实时定位；身份关联与位置时效仍需人工核验。','warning'):note('实体与关系来自合成示例，不构成已核实身份或事实。')}<h3>来源原文</h3><pre class="case-source-text">${esc(f.materials.filter(m=>m.demo&&m.status==='已解析').map(m=>m.name+'\n'+m.text).join('\n\n')||'尚未解析材料；此处仅为示例结构预览。')}</pre><div class="actions">${btn('查看执行记录','case-execution')}${btn('返回导图','close')}</div>`,{wide:true});},
    'case-generate-report':()=>{guard();const f=caseFlow(),c=selectedCase();if(f.run!=='Success')throw Error('请先完成本轮研判');const r={id:uid('REP'),title:c.name+' · 研判报告（合成示例）',version:1,status:'草稿',author:state.user,caseId:c.id,session:'案件五步研判 / '+c.id,history:[],feedback:'',sourceIds:[],caseSources:structuredClone(f.materials),graphVersion:1,graphSnapshot:caseGraphData(c,f,'full'),content:`一、案件概况\n${c.name}（${c.number}）。仅使用内置合成材料，不连接真实业务系统。\n\n二、范围与来源\n${f.materials.map(m=>m.name+' · 已保存合成示例').join('\n')}\n\n三、来源事实\n合成材料记载受害人甲向尾号6071账户转出128,000元，出现号码0712、账号 invest_demo 与设备 DEMO-01。原文陈述与经核验事实分开。\n\n四、跨流关联与待核验推断\n资金、通讯、网络流指向关联人员A。全图25个实体（16原始 + 9新增），关联身份仍需核验。\n\n五、位置候选\n示例地点P对应2026-09-12 14:20历史观测。非实时定位，主体身份、时间与精度待核验。\n\n六、数据缺口与限制\n模拟执行完成不意味着证据已核实。未接真实查询、授权或解析服务；不得用于真实案件结论。\n\n七、下一步建议\n人工核验原文与稳定标识，补充反证与时效说明，经独立复核后再导出。`};state.reports.unshift(r);state.selectedReport=r.id;state.checks={};f.reportId=r.id;f.step=4;log('生成案件报告草稿',r.id);commit('已生成带冻结图谱和材料来源的报告草稿。');},
    'case-report-edit':()=>{guard();state.selectedReport=caseFlow().reportId;go('PG24');},
    'case-report-review':()=>{guard();state.selectedReport=caseFlow().reportId;go('PG25');},
    'case-report-graph':el=>{ensureBusiness();if(!state.cases.some(c=>c.id===el.dataset.caseId))throw Error('案件本地引用已删除，报告冻结快照仍可查看。');state.selectedCase=el.dataset.caseId;changeStep(3);},
    'case-view-report':el=>{ensureBusiness();const c=findCase(el);const r=state.reports.find(r=>r.caseId===c.id);if(!r){toast('该案件尚无报告，请先进入案件完成研判。');return;}state.selectedReport=r.id;go('PG24');},
    'case-upload-report':el=>{ensureBusiness();const c=findCase(el);formModal('导入报告正文',note('仅粘贴合成报告正文；保存为待核验草稿，不冒充已复核报告。')+field('标题','title',c.name+' · 外部合成报告','text','required maxlength="120"')+area('正文','content','','required maxlength="50000" rows="10"'),f=>{ensureBusiness();const r={...Object.fromEntries(f),id:uid('REP'),version:1,status:'草稿',author:state.user,caseId:c.id,session:'外部合成报告',sourceIds:[],history:[],feedback:''};state.reports.unshift(r);state.selectedReport=r.id;go('PG24');commit('报告正文已导入为待核验草稿。');return true;},'保存草稿');},
  });
  installCaseDetail({actions,forms,go,commit,toast,modal,formModal,confirm,ensureBusiness,download,selectedCase,caseFlow});
  forms['case-material-form']=(data)=>{guard();const i=Number(data.get('step')),flow=caseFlow(),m=flow.materials[i];if(!m)throw Error('材料步骤不存在');const text=data.get('text').trim();if(!text)throw Error('原文不能为空');const changed=text!==m.text||data.get('name')!==m.name;m.name=data.get('name');m.text=text;m.demo=text===demoTexts[i];m.status=m.demo?'已解析':'已保存原文';if(changed)invalidateCaseRun(flow);commit(m.demo?'示例解析已保存；所有实体仍待人工核验。':'原文已保存，未接入实体解析服务。');};
  document.addEventListener('change',async e=>{if(e.target.id!=='case-material-file')return;try{guard();const file=e.target.files[0];if(!file)return;if(!/\.txt$/i.test(file.name)||file.size>2*1024*1024)throw Error('仅支持≤2MB的TXT文件');const form=document.querySelector('#case-material-form');form.elements.text.value=await file.text();form.elements.name.value=file.name;form.elements.text.dispatchEvent(new Event('input',{bubbles:true}));toast('原文已填入，请保存；自定义文本不会伪造解析结果。');}catch(error){toast(error.message);}});
}
function invalidateCaseRun(flow){const c=state.cases.find(c=>state.caseFlows?.[c.id]===flow);if(c)c.status='待研判';flow.run='Idle';flow.tick=0;flow.reportId=null;flow.retried=false;flow.authorized=false;flow.events=[];}
export function advanceCaseFlow(flow) {
  if(!flow||flow.run!=='Running'||!state.network)return;
  if(flow.tick===1&&state.scenario==='failure'&&!flow.retried){flow.run='Error';flow.events.push({title:'模拟来源超时，保留已完成节点',time:now(),status:'失败'});return;}
  if(flow.tick===1&&state.scenario==='permission'&&!flow.authorized){flow.run='Waiting';flow.events.push({title:'等待演示授权确认（非生产授权）',time:now(),status:'待确认'});return;}
  if(flow.tick===1&&state.scenario==='partial'&&!flow.retried){flow.run='Exception';flow.events.push({title:'部分来源未完成，请核对缺口',time:now(),status:'异常'});return;}
  if(state.scenario==='empty'){flow.run='Exception';flow.events.push({title:flow.detail?'模拟未检出关联结果，请切换场景后重试':'模拟未检出记录，不能生成位置候选；请切换场景后重试',time:now(),status:'空结果'});return;}
  flow.tick++;flow.events.push({title:(flow.detail?['检查本案材料来源','整理本案实体与待核验关系','完成本地合成研判演示']:['关联资金、通讯与网络线索','形成待核验人员主体','形成历史位置候选'])[flow.tick-1],time:now(),status:'完成'});
  if(flow.tick>=3){flow.run='Success';const c=state.cases.find(c=>state.caseFlows?.[c.id]===flow);if(c)c.status='待核验';}
}
