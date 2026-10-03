import {state,uid,now,log} from './state.js';
import {esc,btn,field,area,select,check,note,empty,table,tag} from './ui.js';
import {entityGraph} from './entity-node.js';
import {detailData,detailCategories,sourceById,documentEntities,detailGraph,transactionScopeForEntity,reportSections,reportParagraphs} from './case-detail-data.js';
import {displayValue,formatDate,formatDateTime,formatMoney} from './formatters.js';
import {buildReportCitations,citationsForSection,citationLocatorLabel,resolveCitation} from './report-citations.js';

const stages=['案情解析','现勘解析','笔录解析','侦查导图','AI报告'];
const stageIcons=['case','forensic','transcript','graph','report'];
const asset=n=>`<img class="cd-icon" src="/assets/figma/case-detail/${n}.svg" alt="">`;
const button=(text,action,extra='',kind='',icon='')=>btn(`${icon?asset(icon):''}<span>${esc(text)}</span>`,action,extra,`cd-btn ${kind}`);
const badge=(text,kind='')=>`<span class="cd-badge ${kind}">${esc(text)}</span>`;
const head=(title,controls='')=>`<header class="cd-panel-head"><h2>${title}</h2><div class="cd-actions">${controls}</div></header>`;
const kv=entries=>`<dl class="cd-kv">${entries.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(displayValue(v))}</dd>`).join('')}</dl>`;
const search=(id,value,placeholder)=>`<form id="${id}" class="cd-search">${asset('search')}<input type="search" name="query" value="${esc(value)}" placeholder="${placeholder}" aria-label="${placeholder}"><button type="submit" aria-label="执行搜索">${asset('chevron')}</button></form>`;
const noData=(text='暂无相关内容')=>`<div class="cd-empty">${asset('file')}<strong>${text}</strong><p>可添加合成材料；本地演示不会伪造解析结果。</p></div>`;
const currentSource=d=>d.step===0?'original':d.step===1?d.forensicId:d.transcriptId;
const sourceButton=(d,ref,label)=>button(label||`来源：${sourceById(d,ref.sourceId)?.name||'来源已删除'} · 第${ref.page}页`,'cd-source',`data-id="${esc(ref.sourceId)}" data-page="${ref.page}"`,'cd-source-link');
function entityCards(d,entities,pageSize=6) {
  const filtered=entities.filter(e=>(!d.query||`${e.title} ${e.person} ${e.role}`.toLowerCase().includes(d.query.toLowerCase()))&&(!d.originFilter||e.origin===d.originFilter));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),page=Math.min(d.entityPage,pages);
  return `<div class="cd-entity-grid">${filtered.slice((page-1)*pageSize,page*pageSize).map(e=>`<article class="cd-entity-card"><div class="cd-card-top">${badge(e.type,e.category)}${button('','cd-entity',`data-id="${esc(e.id)}" aria-label="查看${esc(e.title)}详情"`,'cd-icon-button','more')}</div><h3>${esc(e.title)}</h3>${kv([['角色',e.role]])}<p>${esc(e.person==='待核验'?'关联人：待核验':`关联人：${e.person}`)}</p><p>${esc(e.detail)}</p><footer>${sourceButton(d,e.refs.find(r=>r.sourceId===currentSource(d))||e.refs[0])}${e.origin==='人工补充'?badge('人工补充'):''}</footer></article>`).join('')||noData('暂无匹配实体')}</div><footer class="cd-pagination"><span>共 ${filtered.length} 条 · ${page} / ${pages}</span>${button('上一页','cd-entity-page',`data-page="${page-1}" ${page<=1?'disabled':''}`)}${button('下一页','cd-entity-page',`data-page="${page+1}" ${page>=pages?'disabled':''}`)}</footer>`;
}
function categories(d,entities,action='cd-category',selected=d.category) {
  return `<div class="cd-categories" role="group" aria-label="实体分类（单选）">${Object.entries(detailCategories).map(([id,label])=>`<button class="${selected===id?'active':''} ${id}" data-action="${action}" data-id="${id}" aria-pressed="${selected===id}"><span>${label}</span><span>(${entities.filter(e=>e.category===id).length})</span></button>`).join('')}</div>`;
}
function entityControls(){return button('筛选','cd-filter','','','chevron')+button('添加实体','cd-add-entity','','','add');}
function caseAnalysis(c,d) {
  const original=sourceById(d,'original');
  const entities=documentEntities(d,'original');
  return `<div class="cd-workspace cd-case-layout"><section class="cd-panel">${head('原始案件',button('编辑','cd-edit-original','','','file'))}<div class="cd-scroll cd-original">${badge('合成示例 · 待核验','funds')}<h3>${esc(c.name)}</h3>${kv([['案件编号',c.number],['案件状态',c.caseStatus||'待确认'],['研判状态',c.analysisStatus||c.status],['案件类型',c.caseType||d.type],['线索类别',c.clueCategory||c.category],['受理时间',formatDate(d.date)],['立案单位',c.owner]])}<hr><h3>原始报案材料</h3><pre>${esc(original?.pages.join('\n\n')||d.original||'尚未添加原始材料')}</pre><p class="cd-disclaimer">本页仅展示合成、脱敏示例数据。</p></div></section><section class="cd-panel">${head('案情解析',button('重新解析','cd-reparse','','','refresh'))}<p class="cd-summary">${esc(d.summary)}</p><div class="cd-toolbar"><h3>实体线索（${entities.length}）</h3><div class="cd-actions">${entityControls()}</div></div><div class="cd-classified">${categories(d,entities)}<div class="cd-scroll cd-entity-results"><div class="cd-result-caption"><strong>${detailCategories[d.category]}（${entities.filter(e=>e.category===d.category).length}）</strong><span>所有实体均保留原始材料来源</span></div>${d.query||d.originFilter?`<div class="cd-filter-chip">筛选：${esc(d.query||d.originFilter)} ${button('清除','cd-clear-filter')}</div>`:''}${entityCards(d,entities.filter(e=>e.category===d.category))}</div></div></section></div>`;
}
function documentList(d,kind) {
  const forensic=kind==='forensic',docs=forensic?d.forensics:d.transcripts,selected=forensic?d.forensicId:d.transcriptId;
  const matches=docs.filter(x=>`${x.name} ${x.identity||''}`.includes(d.docQuery));
  return `<aside class="cd-panel cd-document-list" id="cd-document-list">${head(`${forensic?'现勘':'笔录'}文档（${docs.length}）`)}<div class="cd-document-tools">${button(`上传${forensic?'现勘':'笔录'}`,'cd-upload',`data-kind="${kind}"`,'primary')}${search('cd-doc-search',d.docQuery,forensic?'搜索姓名、身份标识':'搜索人名、笔录')}</div><div class="cd-scroll">${matches.map(doc=>`<button class="cd-document ${doc.id===selected?'active':''}" data-action="cd-select-document" data-kind="${kind}" data-id="${doc.id}" aria-pressed="${doc.id===selected}"><strong>${esc(doc.name)}${forensic?'':`，共${sourceById(d,doc.id)?.pages.length||0}页`}</strong><span>${forensic?'身份标识：'+esc(doc.identity):'询问：演示研判员　记录：演示记录员'}</span><span>时间：${esc(formatDate(doc.date))}</span>${badge(doc.demo?doc.role:'已保存 · 未解析',forensic?'net':'person')}</button>`).join('')||noData(docs.length?'没有匹配文档':'尚无文档')}</div></aside>`;
}
function forensicAnalysis(d) {
  const doc=d.forensics.find(x=>x.id===d.forensicId),entities=documentEntities(d,doc?.id);
  return `<div class="cd-workspace cd-forensic-layout">${documentList(d,'forensic')}<section class="cd-panel">${doc?`${head(`${asset('file')}<span>${esc(doc.name)}</span>${badge(doc.role,'person')}`,button('删除文件','cd-delete-document','data-kind="forensic"'))}<div class="cd-classified">${categories(d,entities,'cd-forensic-category',d.forensicCategory)}<div class="cd-scroll cd-forensic-content"><h3>${detailCategories[d.forensicCategory]}（${entities.filter(e=>e.category===d.forensicCategory).length}）</h3>${doc.demo&&d.forensicCategory==='funds'?`<article class="cd-account-detail">${badge('示例支付','net')}<h3>账号基本信息</h3>${kv([['账号',doc.account],['支付属性','用于支付（示例）'],['角色','材料关联账户']])}<h3>交易记录</h3>${table(['平台','网络账号','姓名','金额','时间'],doc.transactions.map(t=>[esc(t.platform),esc(t.account),esc(t.name),formatMoney(t.amount),esc(formatDateTime(t.time))]))}<footer>${sourceButton(d,{sourceId:doc.id,page:1},`来源：${doc.filename} · 资金数据表`)}</footer></article>`:doc.demo?entityCards(d,entities.filter(e=>e.category===d.forensicCategory)):noData('原文已保存，尚未解析')}${!doc.demo?`<pre class="cd-uploaded-text">${esc(sourceById(d,doc.id)?.pages[0])}</pre>`:''}</div></div>`:noData('选择或上传一份现勘材料')}</section></div>`;
}
function transcriptAnalysis(d) {
  const doc=d.transcripts.find(x=>x.id===d.transcriptId),source=sourceById(d,doc?.id),page=Math.min(d.page,source?.pages.length||1),entities=documentEntities(d,doc?.id);
  const documentTools=d.viewerTab==='detail'?`<footer class="cd-viewer-controls">${button('−','cd-zoom','data-delta="-10" aria-label="缩小文档" '+(d.zoom<=80?'disabled':''))}<span>${d.zoom}%</span>${button('+','cd-zoom','data-delta="10" aria-label="放大文档" '+(d.zoom>=160?'disabled':''))}${button('上一页','cd-page',`data-page="${page-1}" ${!doc||page<=1?'disabled':''}`)}<span>${page} / ${source?.pages.length||0}</span>${button('下一页','cd-page',`data-page="${page+1}" ${!doc||page>=source.pages.length?'disabled':''}`)}</footer>`:'';
  const resultTools=doc&&d.resultTab==='entities'?entityControls():'';
  return `<div class="cd-workspace cd-transcript-layout ${d.collapsed?'is-collapsed':''}">${d.collapsed?'':documentList(d,'transcript')}<section class="cd-panel cd-viewer">${head(`${button('','cd-collapse',`aria-label="${d.collapsed?'展开':'收起'}笔录文档区" aria-expanded="${!d.collapsed}" aria-controls="cd-document-list"`,'cd-icon-button','collapse')}<span>${esc(doc?doc.name+'，共'+source.pages.length+'页':'笔录原文')}</span>`,doc?button('重新解析','cd-reparse')+button('删除文件','cd-delete-document','data-kind="transcript"'):'')}<div class="cd-tabs" role="group" aria-label="笔录内容视图">${[['detail','笔录详情'],['qa','笔录问答']].map(([id,label])=>button(label,'cd-viewer-tab',`data-id="${id}" aria-pressed="${d.viewerTab===id}"`,d.viewerTab===id?'active':'')).join('')}</div><div class="cd-scroll cd-paper-wrap">${doc?`<article class="cd-paper" style="font-size:${12*d.zoom/100}px">${d.viewerTab==='qa'?doc.qa?.length?doc.qa.map(([q,a])=>`<section class="cd-qa"><h3>问：${esc(q)}</h3><p>答：${esc(a)}</p></section>`).join(''):noData('上传文本尚未解析为问答'):`<pre>${esc(source.pages[page-1])}</pre>`}</article>`:noData('选择或上传一份笔录')}</div>${documentTools}</section><section class="cd-panel cd-transcript-results"><div class="cd-toolbar"><div class="cd-tabs" role="group" aria-label="解析结果视图">${[['entities','实体线索'],['basic','基本信息']].map(([id,label])=>button(label,'cd-result-tab',`data-id="${id}" aria-pressed="${d.resultTab===id}"`,d.resultTab===id?'active':'')).join('')}</div><div class="cd-actions">${resultTools}</div></div><div class="cd-scroll cd-result-body">${doc?d.resultTab==='basic'?kv([['笔录对象',doc.person],['询问次数',`第${doc.sequence}次`],['记录时间',doc.date],['材料类型',doc.demo?'内置合成笔录':'本地上传文本'],['解析状态',doc.demo?'合成示例 · 待核验':'未接入真实解析'],['总页数',source.pages.length]]):`<div class="cd-inline-categories" role="group" aria-label="实体分类（单选）">${['all',...Object.keys(detailCategories)].map(id=>button(id==='all'?'全部':detailCategories[id],'cd-transcript-category',`data-id="${id}" aria-pressed="${(d.transcriptCategory||'all')===id}"`,(d.transcriptCategory||'all')===id?'active':'')).join('')}</div>${entityCards(d,entities.filter(e=>!d.transcriptCategory||d.transcriptCategory==='all'||e.category===d.transcriptCategory),4)}<p class="cd-disclaimer">${sourceButton(d,{sourceId:doc.id,page})}</p>`:noData('暂无解析结果')}</div></section></div>`;
}
function caseEntityAdvice(e) {
  if(e.category==='funds')return [
    ['调取银行卡开户主体及流水信息','核查银行卡开户主体和交易流水，补充资金流向依据。']
  ];
  if(e.category==='net')return [
    ['调取网络支付账号主体及流水信息','核查网络支付账号主体及交易流水，补充资金流向依据。'],
    ['研判网络账号登录终端','核验登录终端、历史访问行为及相关网络账号，辅助案件研判。'],
    ['网络账号溯源定位','结合设备信息、历史网络环境和平台行为追踪线索。'],
    ['调取第三方主体信息','核查第三方关联账号、社交关系及网络支付机构，补充侦查依据。'],
    ['调取账号使用设备IP','在合法授权范围内核验设备使用网络信息，用于继续开展分析。']
  ];
  if(e.category==='comm')return [
    ['核验号码实名信息','核对号码主体、启用状态及材料中的联络时点。'],
    ['复核通联材料','结合原始通联或聊天材料确认关联关系，避免仅凭号码作身份认定。']
  ];
  return [
    ['核验人员身份','结合原始材料核对身份信息、材料出现位置及与其他实体的关系。'],
    ['复核设备与账号归属','对材料记载的设备、账号或号码归属进行独立核验。']
  ];
}
function caseGraphEntityDetail(d,e) {
  const transactionScope=transactionScopeForEntity(d,e),advice=caseEntityAdvice(e);
  const {primary,related,summary,relatedSummary,scope}=transactionScope;
  const basicInfo=e.category==='funds'?[['开户行','待核验'],['银行卡号',e.title],['开户人姓名',e.person],['主体类别',e.person&&e.person!=='待核验'?'自然人':'待核验']]:e.category==='net'?[['账号类型',e.type],['网络账号',e.title],['关联人',e.person],['信息来源',e.origin]]:e.category==='comm'?[['号码类型',e.type],['手机号码',e.title],['关联人',e.person],['信息来源',e.origin]]:[['实体类型',e.type],['实体名称',e.title],['角色',e.role],['关联人',e.person],['信息来源',e.origin],['内容摘要',e.detail]];
  const infoHtml=basicInfo.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(displayValue(value,{empty:'待核验'}))}</dd></div>`).join('');
  const transactionTable=(rows,emptyText)=>`<div class="cd-entity-table-scroll"><table class="cd-entity-transaction-table"><thead><tr><th>时间</th><th>金额</th><th>姓名</th><th>银行卡号</th><th>网络账号</th><th>订单号</th><th>平台</th><th>来源</th></tr></thead><tbody>${rows.length?rows.map(tx=>`<tr><td>${esc(formatDateTime(tx.time))}</td><td>${formatMoney(tx.amount)}</td><td>${esc(displayValue(tx.name,{empty:'待核验'}))}</td><td>${esc(displayValue(tx.account))}</td><td>${e.category==='net'?esc(displayValue(e.title)):displayValue(null)}</td><td>${esc(displayValue(tx.id))}</td><td>${esc(displayValue(tx.platform))}</td><td>${esc(displayValue(tx.source))}</td></tr>`).join(''):`<tr><td colspan="8" class="cd-entity-empty-cell">${esc(emptyText)}</td></tr>`}</tbody></table></div>`;
  const scopeInfo=[['当前实体',scope.entity],['纳入规则',scope.rule],['交易方向',scope.direction],['时间范围',scope.timeRange],['直接来源',scope.sources.join('；')],['去重规则',`${scope.dedupeKey} · 去除 ${scope.duplicateCount} 条重复`],['材料最新交易时点',scope.latestTransactionAt],['数据更新时间',scope.updatedAt],['数据边界',scope.limitations.length?scope.limitations.join('；'):'现有字段足以完成本地范围计算']];
  const scopeHtml=`<aside class="cd-entity-scope" aria-label="资金统计范围"><strong>统计范围说明</strong><dl>${scopeInfo.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p>${esc(scope.relatedRule)}</p></aside>`;
  const recommendationHtml=advice.map((item,index)=>`<article class="cd-entity-recommendation"><div class="cd-entity-recommendation-head"><span class="cd-entity-recommendation-icon">✦</span><strong>${index+1}、${esc(item[0])}</strong><span class="cd-entity-state">待调证</span></div><div class="cd-entity-recommendation-body"><small>基于当前案件材料生成的核验建议</small><p><span>侦查建议：</span>${esc(item[1])}</p></div></article>`).join('')||'<div class="cd-entity-empty">当前实体暂无调证建议</div>';
  const sources=(e.refs||[]).map(ref=>sourceButton(d,ref)).join('')||'<div class="cd-entity-empty">暂无材料来源</div>';
  const transactionHtml=e.category==='funds'?`${scopeHtml}<div class="cd-entity-section-title">当前实体交易明细 <span>共 ${summary.count} 条 · 合计 ${formatMoney(summary.amount)}</span></div>${transactionTable(primary,'现有材料中暂无账号与当前实体匹配的交易明细')}${related.length?`<div class="cd-entity-section-title">关联材料中的其他账户记录 <span>共 ${relatedSummary.count} 条 · 合计 ${formatMoney(relatedSummary.amount)} · 不计入当前实体统计</span></div>${transactionTable(related,'暂无关联账户记录')}`:''}`:`${related.length?`<div class="cd-entity-section-title">关联材料中的交易记录 <span>共 ${relatedSummary.count} 条 · 不作为当前实体资金统计</span></div>${transactionTable(related,'暂无关联交易记录')}`:transactionTable([], '现有材料中暂无可直接关联的交易明细')}`;
  return `<div class="cd-entity-detail-layout"><nav class="cd-entity-detail-tabs" aria-label="实体详情分区"><button type="button" class="active" data-action="cd-graph-detail-tab" data-tab="basic" aria-selected="true">基本信息</button><button type="button" data-action="cd-graph-detail-tab" data-tab="suggestions" aria-selected="false">调证建议</button><button type="button" data-action="cd-graph-detail-tab" data-tab="notes" aria-selected="false">侦查笔记</button><button type="button" data-action="cd-graph-detail-tab" data-tab="results" aria-selected="false">结果分析</button></nav><div class="cd-entity-detail-content"><section data-detail-pane="basic"><h3>基本信息</h3><dl class="cd-entity-detail-info">${infoHtml}</dl>${transactionHtml}<h3 class="cd-entity-suggestion-title">调证建议（${advice.length}）</h3><div class="cd-entity-recommendations">${recommendationHtml}</div><div class="actions cd-entity-detail-actions">${button('编辑为人工补充','cd-edit-entity',`data-id="${esc(e.id)}"`)}${button('删除实体','cd-delete-entity',`data-id="${esc(e.id)}"`)}</div></section><section data-detail-pane="suggestions" hidden><h3>调证建议（${advice.length}）</h3><div class="cd-entity-recommendations">${recommendationHtml}</div></section><section data-detail-pane="notes" hidden><h3>侦查笔记</h3><div class="cd-entity-empty">当前实体暂无侦查笔记</div></section><section data-detail-pane="results" hidden><h3>结果分析</h3><dl class="cd-entity-detail-info"><div><dt>关联材料</dt><dd>${(e.refs||[]).length} 处</dd></div><div><dt>当前实体交易</dt><dd>${summary.count} 条</dd></div><div><dt>其他账户记录</dt><dd>${relatedSummary.count} 条</dd></div><div><dt>当前结论</dt><dd>仅形成待核验线索，不构成身份或行为性质认定</dd></div></dl><div class="cd-entity-source-title">材料来源（${(e.refs||[]).length}）</div><div class="cd-entity-source-list">${sources}</div></section></div></div>`;
}


function graphPage(d,flow) {
  const all=detailGraph(d,d.graphMode==='all'||!!d.graphQuery||d.graphCategory!=='all'||d.layer!=='all'),nodes=all.nodes.filter(n=>(d.graphCategory==='all'||n.icon===d.graphCategory)&&(!d.graphQuery||`${n.title} ${n.summary}`.includes(d.graphQuery))&&(d.layer==='all'||n.origin===d.layer));
  const links=all.links.filter(e=>nodes.some(n=>n.id===e.from)&&nodes.some(n=>n.id===e.to));
  const hasFilter=!!d.graphQuery||d.graphCategory!=='all'||d.layer!=='all';
  const controls=button(d.graphMode==='all'?'聚焦关键实体':'全部实体','cd-graph-mode')+button('搜索','cd-graph-search','','','search')+button('筛选','cd-graph-filter')+button('图层','cd-graph-layer')+(hasFilter?button('清除筛选','cd-graph-clear'):'')+button(d.fullscreen?'退出全屏':'全屏','cd-fullscreen','','','fullscreen')+button(flow.run==='Running'?'暂停研判':'重新研判',flow.run==='Running'?'case-pause':'cd-run','','primary');
  const runActions=button('执行记录','case-execution')+(flow.run==='Running'?button('推进一步','case-advance'):['Paused','Error','Waiting','Exception'].includes(flow.run)?button('检查并恢复','case-resume'):'')+button('生成AI报告','cd-generate-report','','primary');
  return `<div class="cd-workspace"><section class="cd-panel cd-graph-panel ${d.fullscreen?'cd-fullscreen':''}" aria-label="侦查导图">${head('侦查导图',controls)}<div class="cd-graph-canvas">${nodes.length?entityGraph(nodes,links,{...all,links,id:'case-detail-'+state.selectedCase,ui:state.graphUI?.['case-detail-'+state.selectedCase]||{},detailAction:'cd-entity',variant:'investigation',defaultZoom:1}):noData('没有匹配节点')}<div class="cd-graph-bottom"><div class="cd-actions cd-graph-view-controls" aria-label="导图视图与缩放">${button('−','node-zoom',`data-graph-id="case-detail-${esc(state.selectedCase)}" data-delta="-.15" aria-label="缩小导图"`)}${button('100%','node-reset',`data-graph-id="case-detail-${esc(state.selectedCase)}" data-graph-zoom-label="case-detail-${esc(state.selectedCase)}" aria-label="恢复 100%"`)}${button('+','node-zoom',`data-graph-id="case-detail-${esc(state.selectedCase)}" data-delta=".15" aria-label="放大导图"`)}${button('适应画布','node-fit',`data-graph-id="case-detail-${esc(state.selectedCase)}"`)}</div></div></div><footer class="cd-run-controls"><div class="cd-actions">${runActions}</div></footer></section></div>`;
}
function reportPage(c,d) {
  if(!d.sources.length&&!d.reportId)return `<div class="cd-workspace"><section class="cd-panel">${head('AI 研判报告')}${noData('尚无材料，暂不能生成报告')}</section></div>`;
  const r=state.reports.find(report=>report.id===d.reportId),paragraphs=r?.detailSections||reportParagraphs(c,d),sources=r?.caseSources||d.sources,section=d.reportSection;
  const reportId=r?.id||`draft-${c.id}`;
  const citations=r?.citations||buildReportCitations({caseId:c.id,reportId,detail:{...d,sources},sections:paragraphs});
  const sectionCitations=citationsForSection(citations,section);
  const citationButton=citation=>button(`引用 ${citation.id} · ${citation.sources.length?`${citation.sources.length} 份来源`:'无来源'}`,'cd-report-source',`data-case-id="${esc(c.id)}" data-report-id="${esc(reportId)}" data-citation-id="${esc(citation.id)}"`,'cd-citation-trigger');
  const paragraphsHtml=paragraphs[section].map((paragraph,index)=>{const citation=sectionCitations.find(item=>item.paragraph===index);return `<div class="cd-report-paragraph"><p>${index+1}. ${esc(paragraph)}</p>${citation?`<div class="cd-inline-citations">${citationButton(citation)}</div>`:''}</div>`;}).join('');
  const citationIndex=sectionCitations.map(citation=>`<article class="cd-citation-index-item"><strong>${esc(citation.id)}</strong><p>${esc(citation.text)}</p>${citationButton(citation)}</article>`).join('')||'<p class="muted">本节暂无引用记录。</p>';
  return `<div class="cd-workspace"><section class="cd-panel cd-report-panel">${head(`AI 研判报告 ${badge(r?`${r.status} v${r.version}`:'草稿预览')}`,button('导出 Word','cd-export')+button(r?'重新生成':'生成报告','cd-generate-report')+button('提交复核','cd-review','','primary'))}${r&&r.detailRevision!==d.revision?'<p class="cd-stale" role="status">材料已变更：当前展示生成时的冻结报告，请重新生成后复核。</p>':''}<div class="cd-report-layout"><nav class="cd-report-outline" aria-label="报告目录"><h3>报告目录</h3>${reportSections.map((title,index)=>button(`${['一','二','三','四','五','六','七'][index]}、${title}`,'cd-report-section',`data-id="${index}" aria-pressed="${section===index}"`,section===index?'active':'')).join('')}<p>${sources.length} 份材料 · ${r?'已冻结快照':'尚未保存快照'}</p></nav><article class="cd-scroll cd-report-paper"><h2>${esc(r?.title||c.name+' · 研判报告')}</h2><p class="cd-report-meta">案件编号 ${esc(c.number)}　|　仅供合成演示 · 未经人工核验</p><h3>${['一','二','三','四','五','六','七'][section]}、${reportSections[section]}</h3>${paragraphsHtml}<p><strong>研判建议：</strong>优先核验稳定标识、账号归属与原始凭证，保留冲突与反证。</p></article><aside class="cd-scroll cd-evidence"><h3>本节引用 ${badge('可追溯','comm')}</h3>${citationIndex}${button(r?'本轮侦查导图 · 冻结快照':'本轮侦查导图 · 当前预览','cd-report-graph','','cd-evidence-item')}<p>引用 fixture 为本地合成演示；事实、推断与待核验项分开标识。</p></aside></div></section></div>`;
}
function caseEntityDetailTitle(e) {
  const raw=String(e?.title||e?.id||'待核验');
  if(e?.category==='funds'){
    const digits=raw.replace(/\D/g,'');
    return `银行卡 · ${digits.length>=4?'尾号'+digits.slice(-4):raw}`;
  }
  if(e?.category==='net')return `${e.type||'网络账号'} · ${raw}`;
  return `${e?.type||'实体'} · ${raw}`;
}
export function renderCaseDetail(c,flow) {
  const d=detailData(c,flow);d.step=flow.step;
  return `<div class="cd-detail"><header class="cd-case-header"><div class="cd-case-title"><a class="cd-back" href="#/PG12" aria-label="返回案件列表">${asset('back')}</a><h1>${esc(c.name)}</h1>${badge(c.analysisStatus||c.status,'comm')}</div><div class="cd-actions">${button('简要案情','cd-brief','','cd-quiet','file')}${button('操作指引','case-help','','cd-quiet','info')}${button('案件问卷','cd-questionnaire','','cd-quiet','clipboard')}</div></header><nav class="cd-stage-nav" aria-label="案件研判步骤">${stages.map((label,i)=>`${i>=3?`<span class="cd-stage-arrow" aria-hidden="true">${asset('arrow')}</span>`:''}<button data-action="case-stage" data-step="${i}" aria-controls="case-stage-content" ${flow.step===i?'aria-current="step"':''}>${asset(stageIcons[i]+(flow.step===i?'-active':''))}<span>${label}</span></button>`).join('')}</nav><div id="case-stage-content" class="cd-stage-content">${flow.step===0?caseAnalysis(c,d):flow.step===1?forensicAnalysis(d):flow.step===2?transcriptAnalysis(d):flow.step===3?graphPage(d,flow):reportPage(c,d)}</div></div>`;
}

export function installCaseDetail({actions,forms,go,commit,toast,modal,formModal,confirm,ensureBusiness,download,selectedCase,caseFlow}) {
  const context=()=>{ensureBusiness();const c=selectedCase();if(!c)throw Error('案件不存在');const flow=caseFlow(c);return {c,flow,d:detailData(c,flow)};};
  const sameCase=id=>{const ctx=context();if(ctx.c.id!==id)throw Error('案件已切换，请关闭窗口后重试。');return ctx;};
  const mutate=d=>{d.revision++;const {c,flow}=context();flow.run='Idle';flow.tick=0;flow.events=[];c.analysisStatus='待研判';c.status=c.analysisStatus;};
  const showSource=(d,ref)=>{const s=sourceById(d,ref.sourceId);if(!s)throw Error('来源不存在或已删除');modal('来源原文 · '+s.name,`${note('合成示例 / 本地保存原文，不代表已核验事实。')}<pre class="case-source-text">${esc(s.pages[(ref.page||1)-1]||s.pages[0])}</pre><div class="actions">${button('定位到材料','cd-locate-source',`data-id="${esc(s.id)}" data-page="${ref.page||1}"`)}${button('关闭','close')}</div>`,{wide:true});};
  const saveReport=()=>{
    const {c,d,flow}=context();if(!d.sources.length)throw Error('请先添加材料，再生成报告。');
    const previous=state.reports.find(r=>r.id===d.reportId),sections=reportParagraphs(c,d),reportId=uid('REP');
    const citations=buildReportCitations({caseId:c.id,reportId,detail:d,sections});
    const r={id:reportId,title:c.name+' · 研判报告',version:(previous?.version||0)+1,status:'草稿',author:state.user,caseId:c.id,session:'案件合成研判',sourceIds:[],caseSources:structuredClone(d.sources).map(s=>({...s,text:s.pages.join('\n\n')})),citations:structuredClone(citations),graphSnapshot:structuredClone(detailGraph(d,true)),graphVersion:d.revision,detailRevision:d.revision,detailSections:structuredClone(sections),created:now(),history:[],feedback:'',content:reportSections.map((t,i)=>`${t}\n${sections[i].join('\n')}`).join('\n\n')};
    state.reports.unshift(r);state.selectedReport=r.id;state.checks={};d.reportId=r.id;flow.reportId=r.id;log('生成案件冻结报告',r.id);return r;
  };
  const currentReport=()=>{const {d}=context();const r=state.reports.find(r=>r.id===d.reportId);if(!r)throw Error('请先生成报告，保存本轮来源快照。');return r;};
  const citationContext=dataset=>{
    const {c,d}=context();
    if(dataset.caseId!==c.id)throw Error('案件上下文已变化，请返回当前报告后重试。');
    const draft=dataset.reportId===`draft-${c.id}`;
    const report=draft?null:state.reports.find(item=>item.id===dataset.reportId&&item.caseId===c.id);
    if(!draft&&!report)throw Error('引用失效：当前报告版本不存在。');
    const sections=report?.detailSections||reportParagraphs(c,d),sources=report?.caseSources||d.sources;
    const citations=report?.citations||buildReportCitations({caseId:c.id,reportId:dataset.reportId,detail:{...d,sources},sections});
    const citation=citations.find(item=>item.id===dataset.citationId&&item.caseId===c.id&&item.reportId===dataset.reportId);
    return {c,d,report,sources,citation};
  };
  const highlightedSource=(text,quote)=>{
    const value=String(text||''),index=quote?value.indexOf(quote):-1;
    if(index<0)return esc(value);
    return `${esc(value.slice(0,index))}<mark id="citation-target">${esc(quote)}</mark>${esc(value.slice(index+quote.length))}`;
  };
  const citationPreviewBody=(dataset,selectedSourceId)=>{
    const {c,report,sources,citation}=citationContext(dataset),resolved=resolveCitation(citation,sources,selectedSourceId);
    const reportTitle=report?.title||`${c.name} · 研判报告（草稿预览）`;
    const sourceList=citation?.sources?.length?citation.sources.map(ref=>{const source=sources.find(item=>item.id===ref.sourceId),active=resolved.ref?.sourceId===ref.sourceId;return button(source?.name||`材料不可用 · ${ref.sourceId}`,'cd-report-source-select',`data-case-id="${esc(c.id)}" data-report-id="${esc(dataset.reportId)}" data-citation-id="${esc(dataset.citationId)}" data-source-id="${esc(ref.sourceId)}" aria-pressed="${active}"`,active?'active':'');}).join(''):'<p class="muted">此引用没有关联材料。</p>';
    const statusClass=resolved.status==='ready'?'ready':resolved.status;
    let documentHtml='';
    if(resolved.source&&resolved.status!=='unavailable'){
      const quote=resolved.status==='ready'?resolved.ref?.quote:null;
      documentHtml=`<section class="cd-citation-document"><header><div><strong>${esc(resolved.source.name)}</strong><p>来源 ID：<code>${esc(resolved.source.id)}</code> · 本地材料版本：v${esc(resolved.ref?.sourceVersion??resolved.source.version??'未提供')}</p></div>${resolved.source.demo?badge('demo 合成来源','comm'):badge('本地人工材料')}</header><div class="cd-citation-location"><strong>定位</strong><span>${esc(citationLocatorLabel(resolved.ref))}</span>${resolved.status==='ready'&&!resolved.precise?'<em>未提供精确定位，以下展示正确材料全文。</em>':''}</div><pre>${highlightedSource(resolved.text,quote)}</pre></section>`;
    }
    return `<div class="cd-citation-preview"><section class="cd-citation-context"><div><span>当前报告</span><strong>${esc(reportTitle)}</strong><small>案件 ${esc(c.number)} · 报告上下文 ${esc(dataset.reportId)} · ${report?'报告冻结快照':'草稿当前材料'}</small></div><div><span>当前引用</span><strong>${esc(citation?.id||dataset.citationId)}</strong><small>${citation?.demo?'demo citation fixture':'引用元数据不可用'}</small></div></section>${citation?`<blockquote>${esc(citation.text)}</blockquote>`:''}<div class="cd-citation-layout"><aside class="cd-citation-source-list"><h3>关联材料</h3>${sourceList}</aside><div class="cd-citation-source-panel"><div class="cd-citation-status ${esc(statusClass)}" role="status"><strong>${esc({ready:'来源已定位',invalid:'引用失效','no-source':'没有来源',unavailable:'材料不可用'}[resolved.status]||'引用状态')}</strong><span>${esc(resolved.status==='ready'?(resolved.precise?'已定位到材料快照中的可核对位置。':'已定位到正确材料，但未提供精确定位。'):resolved.message)}</span></div>${documentHtml}</div></div><div class="form-actions"><button type="button" class="btn primary" data-action="close">返回报告</button></div></div>`;
  };
  const openCitationPreview=dataset=>{
    const body=citationPreviewBody(dataset,dataset.sourceId);
    modal(`报告来源 · ${dataset.citationId}`,body,{wide:true,className:'cd-citation-modal'});
    setTimeout(()=>document.querySelector('#citation-target')?.scrollIntoView({block:'center'}),0);
  };
  Object.assign(actions,{
    'cd-brief':()=>{const {c,d}=context();modal(c.name,`${note('合成示例，不用于真实案件结论。')}<p>${esc(d.summary)}</p><pre class="case-source-text">${esc(d.original)}</pre>`);},
    'cd-questionnaire':()=>{const {c,d}=context();formModal('案件问卷',note('仅记录当前案件的本地人工补充，不自动生成事实或身份结论。')+area('补充说明 / 待核验事项','answer',d.questionnaire,'maxlength="5000" rows="6"'),f=>{sameCase(c.id);d.questionnaire=f.get('answer').trim();commit('问卷已保存到当前案件。');return true;});},
    'cd-category':el=>{const {d}=context();if(detailCategories[el.dataset.id])d.category=el.dataset.id;d.entityPage=1;commit();},
    'cd-forensic-category':el=>{const {d}=context();if(detailCategories[el.dataset.id])d.forensicCategory=el.dataset.id;d.entityPage=1;commit();},
    'cd-transcript-category':el=>{const {d}=context();if(el.dataset.id==='all'||detailCategories[el.dataset.id])d.transcriptCategory=el.dataset.id;d.entityPage=1;commit();},
    'cd-entity-page':el=>{context().d.entityPage=Math.max(1,Number(el.dataset.page)||1);commit();},
    'cd-select-document':el=>{const {d}=context(),kind=el.dataset.kind;if(!['forensic','transcript'].includes(kind))return;if(!(kind==='forensic'?d.forensics:d.transcripts).some(x=>x.id===el.dataset.id))throw Error('文档不存在');d[kind+'Id']=el.dataset.id;d.page=1;d.entityPage=1;d.query='';d.originFilter='';commit();},
    'cd-collapse':()=>{const {d}=context();d.collapsed=!d.collapsed;commit();document.querySelector('[data-action="cd-collapse"]')?.focus();},
    'cd-viewer-tab':el=>{const {d}=context();if(['detail','qa'].includes(el.dataset.id))d.viewerTab=el.dataset.id;commit();},
    'cd-result-tab':el=>{const {d}=context();if(['entities','basic'].includes(el.dataset.id))d.resultTab=el.dataset.id;commit();},
    'cd-page':el=>{const {d}=context();d.page=Math.max(1,Math.min(sourceById(d,d.transcriptId)?.pages.length||1,Number(el.dataset.page)||1));commit();},
    'cd-zoom':el=>{const {d}=context();d.zoom=Math.max(80,Math.min(160,d.zoom+Number(el.dataset.delta)));commit();},
    'cd-filter':()=>{const {c,d}=context();formModal('筛选实体',field('名称、角色或关联人','query',d.query,'search','maxlength="100"')+select('来源类型','origin',['全部','材料记载','人工补充'],d.originFilter||'全部'),f=>{sameCase(c.id);d.query=f.get('query').trim();d.originFilter=f.get('origin')==='全部'?'':f.get('origin');d.entityPage=1;commit('实体筛选已更新。');return true;});},
    'cd-clear-filter':()=>{const {d}=context();d.query='';d.originFilter='';d.entityPage=1;commit();},
    'cd-source':el=>{const {d}=context();showSource(d,{sourceId:el.dataset.id,page:Number(el.dataset.page)||1});},
    'cd-locate-source':el=>{const {d,flow}=context(),s=sourceById(d,el.dataset.id);if(!s)throw Error('来源不存在');actions.close();d.query='';d.docQuery='';d.page=Number(el.dataset.page)||1;if(s.kind==='case')flow.step=0;else if(s.kind==='forensic'){flow.step=1;d.forensicId=s.id;}else {flow.step=2;d.transcriptId=s.id;d.viewerTab='detail';}go('PG13');},
    'cd-entity':el=>{const {d}=context(),e=d.entities.find(e=>e.id===el.dataset.id);if(!e)throw Error('实体不存在');if(el.closest('.cd-graph-panel')){modal(caseEntityDetailTitle(e),caseGraphEntityDetail(d,e),{drawer:true,className:'case-entity-detail-modal shared-entity-detail'});return;}modal(e.title,`${badge(e.origin,e.category)}${kv([['类型',e.type],['角色',e.role],['关联人',e.person],['内容',e.detail]])}${note('标识仅用于合成演示；同尾号、同名不能直接认定同一主体。')}<h3>材料来源（${e.refs.length}）</h3><div class="stack">${e.refs.map(r=>sourceButton(d,r)).join('')}</div><div class="actions">${button('编辑为人工补充','cd-edit-entity',`data-id="${esc(e.id)}"`)}${button('删除实体','cd-delete-entity',`data-id="${esc(e.id)}"`)}</div>`,{wide:true});},
    'cd-graph-detail-tab':el=>{const dialog=el.closest('.case-entity-detail-modal');if(!dialog)return;dialog.querySelectorAll('[data-action="cd-graph-detail-tab"]').forEach(button=>{const active=button===el;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});dialog.querySelectorAll('[data-detail-pane]').forEach(pane=>{pane.hidden=pane.dataset.detailPane!==el.dataset.tab;});const content=dialog.querySelector('.cd-entity-detail-content');if(content)content.scrollTop=0;},
    'cd-add-entity':()=>editEntity(),
    'cd-edit-entity':el=>editEntity(el.dataset.id),
    'cd-delete-entity':el=>{const {c,d}=context(),e=d.entities.find(e=>e.id===el.dataset.id);if(!e)throw Error('实体不存在');confirm('删除当前实体？','仅删除本案本地实体；原始材料及报告冻结版本保留。',()=>{sameCase(c.id);d.entities=d.entities.filter(x=>x.id!==e.id);mutate(d);commit('本地实体已删除，报告快照未改写。');},'删除实体');},
    'cd-edit-original':()=>{const {c,d}=context();formModal('编辑原始案件材料',note('保存修改后，原材料的自动提取引用将失效；不会对自定义文本伪造解析结果。','warning')+area('原始报案材料','text',sourceById(d,'original')?.pages[0]||'','required maxlength="20000" rows="12"'),f=>{sameCase(c.id);const text=f.get('text').trim();if(!text)throw Error('原文不能为空');if(text!==sourceById(d,'original')?.pages[0]){detachSource(d,'original');d.original=text;d.summary='原始材料已修改；尚未接入真实解析，请人工核验并补充实体。';const previousVersion=sourceById(d,'original')?.version||0;d.sources=d.sources.filter(s=>s.id!=='original');d.sources.unshift({id:'original',name:'原始报案材料（人工编辑）',kind:'case',demo:false,version:previousVersion+1,pages:[text]});mutate(d);}commit('原文已保存，不自动生成解析实体。');return true;});},
    'cd-reparse':()=>{const {d}=context(),s=sourceById(d,currentSource(d));if(!s)throw Error('请先选择材料');toast(s.demo?'当前展示内置合成解析结果；未调用真实解析服务。':'自定义原文已保存。未接入解析服务，可人工添加实体并指定来源。');},
    'cd-upload':el=>{const {c,d}=context(),kind=el.dataset.kind;if(!['forensic','transcript'].includes(kind))return;formModal('上传'+(kind==='forensic'?'现勘':'笔录')+'材料',note('本地演示支持≤2MB TXT或粘贴文本。ZIP、PDF、OCR及真实解析未接入；上传后仅保存原文。')+`<label class="field"><span>选择合成文本文件</span><input id="cd-upload-file" type="file" accept=".txt,text/plain"></label>`+field('材料名称','name','','text','required maxlength="120"')+field('材料对象','person','','text','required maxlength="50"')+area('原文','text','','required maxlength="20000" rows="8"'),f=>{sameCase(c.id);const name=f.get('name').trim(),person=f.get('person').trim(),text=f.get('text').trim();if(!name||!person||!text)throw Error('必填项不能仅为空格');const id=uid('DOC'),date=new Date().toLocaleDateString('sv-SE');d.sources.push({id,name,kind,demo:false,version:1,pages:[text]});if(kind==='forensic'){d.forensics.push({id,name:person,filename:name,identity:'未提取',date,demo:false,role:'未解析',transactions:[]});d.forensicId=id;}else {d.transcripts.push({id,name,person,date,sequence:d.transcripts.filter(x=>x.person===person).length+1,demo:false,role:'未解析',qa:[]});d.transcriptId=id;d.page=1;}d.docQuery='';mutate(d);commit('原文已保存到当前案件，未自动提取实体。');return true;},'保存原文');},
    'cd-delete-document':el=>{const {c,d}=context(),kind=el.dataset.kind,id=d[kind+'Id'];if(!sourceById(d,id))throw Error('材料不存在');confirm('删除本地材料？','该材料的实体引用将移除；其他来源继续保留，已生成报告快照不受影响。',()=>{sameCase(c.id);detachSource(d,id);d.sources=d.sources.filter(s=>s.id!==id);const key=kind==='forensic'?'forensics':'transcripts';d[key]=d[key].filter(s=>s.id!==id);d[kind+'Id']=d[key][0]?.id;d.page=1;d.entityPage=1;mutate(d);commit('本地材料及其活动引用已删除。');},'删除材料');},
    'cd-graph-search':()=>{const {c,d}=context();formModal('搜索导图',field('实体名称或内容','query',d.graphQuery,'search','maxlength="100"'),f=>{sameCase(c.id);d.graphQuery=f.get('query').trim();commit();return true;});},
    'cd-graph-filter':()=>{const {c,d}=context();formModal('筛选导图',select('实体类别','category',['全部',...Object.values(detailCategories)],detailCategories[d.graphCategory]||'全部'),f=>{sameCase(c.id);d.graphCategory=Object.keys(detailCategories).find(k=>detailCategories[k]===f.get('category'))||'all';commit();return true;});},
    'cd-graph-layer':()=>{const {c,d}=context();formModal('导图图层',select('显示来源图层','layer',['全部','材料记载','人工补充'],d.layer==='all'?'全部':d.layer)+note('虚线关联为待核验推断，不等同于事实。'),f=>{sameCase(c.id);d.layer=f.get('layer')==='全部'?'all':f.get('layer');commit();return true;});},
    'cd-graph-mode':()=>{const {d}=context();d.graphMode=d.graphMode==='all'?'focus':'all';commit();},
    'cd-graph-clear':()=>{const {d}=context();d.graphQuery='';d.graphCategory='all';d.layer='all';commit();},
    'cd-fullscreen':()=>{const {d}=context();d.fullscreen=!d.fullscreen;commit();document.querySelector('[data-action="cd-fullscreen"]')?.focus();},
    'cd-run':()=>{const {d,flow}=context();if(!d.entities.length)throw Error('尚无实体，请先添加材料和来源线索。');if(!state.network)throw Error('当前模拟断线，请恢复后重试。');if(['Paused','Error','Waiting','Exception'].includes(flow.run)){toast('请先检查并恢复当前轮次，已完成步骤不会重放。');return;}flow.run='Running';flow.tick=0;flow.retried=false;flow.authorized=false;flow.events=[{title:'启动本案合成线索关联演示；不发起真实查询',time:now(),status:'运行中'}];commit('已启动本地模拟，可推进一步检查过程。');},
    'cd-generate-report':()=>{saveReport();context().flow.step=4;commit('已保存独立报告版本及材料、图谱快照。');},
    'cd-report-section':el=>{const {d}=context(),i=Number(el.dataset.id);if(i>=0&&i<reportSections.length)d.reportSection=i;commit();},
    'cd-report-source':el=>openCitationPreview(el.dataset),
    'cd-report-source-select':el=>{const body=citationPreviewBody(el.dataset,el.dataset.sourceId),modalBody=el.closest('.modal')?.querySelector('.modal-body');if(!modalBody)throw Error('来源预览已关闭。');modalBody.innerHTML=body;setTimeout(()=>{modalBody.querySelector(`[data-source-id="${CSS.escape(el.dataset.sourceId)}"]`)?.focus();modalBody.querySelector('#citation-target')?.scrollIntoView({block:'center'});},0);},
    'cd-report-graph':()=>{const {d}=context(),r=state.reports.find(r=>r.id===d.reportId),graph=r?.graphSnapshot||detailGraph(d,true);modal(r?'报告图谱 · 冻结快照':'报告图谱 · 当前草稿预览',entityGraph(graph.nodes,graph.links,{...graph,id:'frozen-'+(r?.id||'preview'),readonly:true})+note(r?'仅为报告生成时的合成线索图，不随当前材料更新。':'尚未生成报告，此处展示当前合成线索。'),{wide:true});},
    'cd-review':()=>{const r=currentReport(),{c,d}=context();if(r.detailRevision!==d.revision)throw Error('材料已变更，请重新生成报告后复核。');formModal('提交当前报告复核',note('核对当前冻结版本后，提交给不同的业务负责人；不会自动通过复核。')+check('已检查材料原文与引用来源','sources',false,'required')+check('已区分材料记载、推断与人工补充','inferences',false,'required')+check('已检查数据缺口、冲突和适用范围','limits',false,'required'),f=>{sameCase(c.id);if(r.detailRevision!==d.revision)throw Error('材料已变更，请重新生成报告。');if(!['sources','inferences','limits'].every(k=>f.get(k)))throw Error('请完成三项核验');state.selectedReport=r.id;state.checks={...state.checks,'report-check-1':true,'report-check-2':true,'report-check-3':true};actions['submit-review']();go('PG25');return true;},'提交复核');},
    'cd-export':()=>{const r=currentReport(),{c,d}=context();formModal('导出 Word 兼容文档',note('导出 .doc（HTML兼容文档），非原生 DOCX。正文和来源按冻结版本导出；草稿不代表已复核。','warning')+field('导出用途','purpose','','text','required maxlength="200"')+check('我已知悉这是合成演示，且当前报告状态为：'+esc(r.status),'ack',false,'required'),f=>{sameCase(c.id);if(r.detailRevision!==d.revision)throw Error('材料已变更，请重新生成后导出。');if(!f.get('ack')||!f.get('purpose').trim())throw Error('请填写用途并确认演示边界');const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${esc(r.title)}</title><body><h1>${esc(r.title)}</h1><p>v${r.version} · ${esc(r.status)} · 合成演示，不作为真实业务结论</p><p>用途：${esc(f.get('purpose'))}</p><pre>${esc(r.content)}</pre><h2>来源冻结快照</h2>${r.caseSources.map(s=>`<h3>${esc(s.name)}</h3><pre>${esc(s.text)}</pre>`).join('')}</body></html>`;download(r.title+'.doc',html,'application/msword');commit();return true;},'确认导出');},
  });
  function detachSource(d,id){d.entities=d.entities.map(e=>({...e,refs:e.refs.filter(r=>r.sourceId!==id)})).filter(e=>e.refs.length);}
  function editEntity(id) {
    const {c,d}=context(),e=d.entities.find(e=>e.id===id),sourceId=e?.refs[0]?.sourceId||currentSource(d);
    if(!d.sources.length)throw Error('先添加材料，人工实体必须有来源。');
    formModal(e?'编辑为人工补充':'添加人工实体',note('人工补充独立标记，不伪装成自动提取。必须指定材料来源。')+field('实体名称','title',e?.title||'','text','required maxlength="80"')+select('类别','category',Object.values(detailCategories),detailCategories[e?.category||'funds'])+field('角色','role',e?.role||'待核验','text','required maxlength="60"')+field('关联人','person',e?.person||'待核验','text','required maxlength="60"')+area('补充说明','detail',e?.detail||'','required maxlength="1000"')+`<label class="field"><span>来源材料</span><select name="sourceId">${d.sources.map(s=>`<option value="${esc(s.id)}" ${s.id===sourceId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`+field('来源页码','page',e?.refs[0]?.page||1,'number','required min="1" step="1"'),f=>{sameCase(c.id);const s=sourceById(d,f.get('sourceId')),page=Number(f.get('page'));if(!s||!Number.isInteger(page)||page<1||page>s.pages.length)throw Error('请填写来源材料中实际存在的页码');for(const k of ['title','role','person','detail'])if(!f.get(k).trim())throw Error('必填项不能为空');const category=Object.keys(detailCategories).find(k=>detailCategories[k]===f.get('category'));const item={id:e?.id||uid('ENTITY'),title:f.get('title').trim(),role:f.get('role').trim(),person:f.get('person').trim(),detail:f.get('detail').trim(),category,type:{funds:'资金实体',person:'人员',net:'网络账号',comm:'手机号码'}[category],origin:'人工补充',refs:[{sourceId:s.id,page}]};if(e)d.entities=d.entities.map(x=>x.id===e.id?item:x);else d.entities.push(item);d.category=category;d.transcriptCategory='all';d.query='';d.originFilter='';d.entityPage=1;mutate(d);commit('人工实体及来源已保存。');return true;});
  }
  forms['cd-doc-search']=f=>{const {d}=context();d.docQuery=f.get('query').trim();commit();};
  document.addEventListener('change',async event=>{
    if(event.target.id!=='cd-upload-file')return;
    try{const {c}=context(),file=event.target.files[0];if(!file)return;if(!/\.txt$/i.test(file.name)||file.size>2*1024*1024)throw Error('只接受≤2MB的TXT文本');const text=await file.text();sameCase(c.id);if(text.length>20000)throw Error('演示文本最多20,000字');const form=event.target.closest('form');if(!form?.isConnected)return;form.elements.name.value=file.name;form.elements.text.value=text;toast('已填入原文，请补全对象并保存。');}catch(e){toast(e.message);}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.cd-fullscreen')){context().d.fullscreen=false;commit();}});
}
