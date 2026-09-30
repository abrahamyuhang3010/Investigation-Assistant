import {state,uid} from './state.js';
import {esc,btn,tag} from './ui.js';
import {fitEntityGraphs} from './entity-node.js';
import {renderSuperSearchWorkspace,renderSuperSearchSidebar,toggleSuperSearchList} from './super-search.js';
import {ensureSuperSearchState,ensureSuperSearchLayout,getSuperSearchArtifact,getSuperSearchEntity,getSuperSearchTool,selectSuperQuery,startSuperQuery,canStartSuperQuery,confirmSuperQueryScope,confirmSuperQueryPlan,requestStopSuperQuery,replanSuperQuery,requestSuperSearchPermission,resumeSuperSearchQuery,cancelSuperSearchPermission,reopenSuperPermission,controlSuperTool,tickSuperSearch,getSuperSearchTaskProgress,materializeHistoricalSession} from './super-search-model.js';
import {artifactPreview,downloadSuperArtifact,uploadSuperFile} from './super-search-files.js';

/** Capture only this page's local UI. No global shell or other route is altered. */
export function captureSuperSearchView(){
 if(!document.querySelector('.super-search-page'))return null;
 const page=document.querySelector('.super-search-page'),focused=document.activeElement,root=focused?.closest('.ss-center,.ss-workspace,.ss-sidebar');
 const messages=page.querySelector('.ss-messages');
 if(messages&&!page.dataset.newTask){const state=ensureSuperSearchState(),nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<=80;state.ui.messageScrollTop=messages.scrollTop;state.ui.followLatest=nearBottom;if(nearBottom)state.ui.hasNewProgress=false;}
 return {scroll:[...document.querySelectorAll('.ss-right-content,.ss-messages,.ss-session-list')].map(e=>({className:(e.closest('#overlay')?'#overlay ':'.super-search-page ')+(e.classList.contains('ss-messages')?'.ss-messages':e.classList.contains('ss-session-list')?'.ss-session-list':'.ss-right-content'),top:e.scrollTop})),focus:root?{overlay:!!focused.closest('#overlay'),id:focused.id,action:focused.dataset.action,key:focused.dataset.id,tab:focused.dataset.tab,pane:focused.dataset.pane,control:focused.dataset.control,start:focused.selectionStart,end:focused.selectionEnd}:null};
}
export function restoreSuperSearchView(view){
 if(!document.querySelector('.super-search-page'))return;
 growComposer();
 fitFundHistoryGraphs();
 const page=document.querySelector('.super-search-page'),messages=page?.querySelector('.ss-messages'),state=page?.dataset.newTask?null:ensureSuperSearchState();
 if(messages&&state){const saved=view?.scroll?.find(item=>item.className==='.super-search-page .ss-messages')?.top??state.ui.messageScrollTop??0;messages.scrollTop=state.ui.followLatest?messages.scrollHeight:saved;state.ui.messageScrollTop=messages.scrollTop;}
 if(view){for(const item of view.scroll){if(item.className==='.super-search-page .ss-messages')continue;document.querySelector(item.className)?.scrollTo({top:item.top});}const f=view.focus;let el;const scope=document.querySelector(f?.overlay?'#overlay':'.super-search-page');if(f?.id)el=scope?.querySelector('#'+CSS.escape(f.id));else if(f?.action)el=[...scope.querySelectorAll('[data-action]')].find(e=>e.dataset.action===f.action&&e.dataset.id===f.key&&e.dataset.tab===f.tab&&e.dataset.pane===f.pane&&e.dataset.control===f.control&&e.getClientRects().length);el?.focus({preventScroll:true});if(el?.setSelectionRange&&f.start!=null)el.setSelectionRange(f.start,f.end);}
}

// The large historical network needs a full overview; shared graph defaults remain untouched.
function fitFundHistoryGraphs(){
 document.querySelectorAll('.ss-rich-graph').forEach(graph=>{
  if(graph.dataset.zoom!=='fit')return;
  const viewport=graph.querySelector('.entity-viewport'),stage=graph.querySelector('.entity-stage'),extent=graph.querySelector('.entity-extent');
  const width=Number(graph.dataset.width),height=Number(graph.dataset.height),scale=Math.min(1,viewport.clientWidth/width,viewport.clientHeight/height);
  stage.style.transform=`scale(${scale})`;extent.style.width=`${width*scale}px`;extent.style.height=`${height*scale}px`;graph.dataset.scale=scale;
 });
}
function growComposer(){const el=document.querySelector('#super-search-prompt,.ss-new-task #prompt');if(el){el.style.height='auto';el.style.height=Math.min(144,Math.max(26,el.scrollHeight))+'px';}}
export function installSuperSearch({actions,forms,commit,render,persist,toast,modal,route,go}){
 const ss=ensureSuperSearchState,layout=ensureSuperSearchLayout;
 // CSS selector lists follow DOM order, not selector order. Explicitly prefer the drawer.
 const surface=selector=>document.querySelector('#overlay '+selector)||document.querySelector('.super-search-page '+selector);
 const scrollToSource=selector=>requestAnimationFrame(()=>surface(selector)?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
 const workspaceOverlayMode=()=>matchMedia('(max-width:1319px)').matches;
 const isNewTaskPage=()=>route()==='PG04'||!!document.querySelector('.super-search-page[data-new-task="true"]');
 const workspaceOptions=()=>isNewTaskPage()?{empty:true,activeTab:layout().newTaskTab}:{ };
 const sidebarOptions=()=>isNewTaskPage()?{newTask:true}:{ };
 function syncWorkspaceExpanded(expanded,focus=true){
  const current=layout();current[isNewTaskPage()?'newTaskWorkspaceExpanded':'workspaceExpanded']=expanded;persist();
  const page=document.querySelector('.super-search-page');page?.classList.toggle('ss-right-collapsed',!expanded);
  const card=page?.querySelector('.ss-workspace-card');if(card){card.inert=!expanded;card.setAttribute('aria-hidden',String(!expanded));}
  const launcher=page?.querySelector('.ss-workspace-launcher');if(launcher)launcher.setAttribute('aria-expanded',String(expanded));
  if(!focus)return;setTimeout(()=>{(expanded?surface('[data-action="super-pane-collapse"][data-pane="right"]'):page?.querySelector('[data-action="super-pane-expand"][data-pane="right"]'))?.focus({preventScroll:true});},matchMedia('(prefers-reduced-motion:reduce)').matches?0:230);
 }
 function openWorkspace(){
  syncWorkspaceExpanded(true,false);
  if(workspaceOverlayMode()){if(!document.querySelector('#overlay .ss-workspace'))modal('研判空间',renderSuperSearchWorkspace(undefined,workspaceOptions()),{drawer:true});requestAnimationFrame(()=>surface('[data-action="super-pane-collapse"][data-pane="right"]')?.focus({preventScroll:true}));return;}
  syncWorkspaceExpanded(true);
 }
 function closeSessionMenu(){if(!layout().sessionMenuId)return;layout().sessionMenuId=null;persist();document.querySelectorAll('.ss-session-menu').forEach(el=>el.remove());document.querySelectorAll('[data-action="super-session-menu"]').forEach(el=>el.setAttribute('aria-expanded','false'));}
 function closeComposerMenu(focus=false){const context=layout().composerMenuOpen;if(!context)return;layout().composerMenuOpen=null;persist();document.querySelectorAll('.ss-composer-menu').forEach(el=>el.remove());document.querySelectorAll('[data-action="super-composer-menu"]').forEach(el=>el.setAttribute('aria-expanded','false'));if(focus)surface(`[data-action="super-composer-menu"][data-context="${context}"]`)?.focus();}
 const composerSelection=context=>layout().composerSelections[context];
 const canUseResources=()=>state.loggedIn&&state.permission&&state.org==='演示研判一组'&&!['平台管理员','安全审计人员'].includes(state.role);
 const uploadForm=context=>`<form id="super-composer-upload-form"><input type="hidden" name="context" value="${context}"><p class="muted">支持文档、表格、PDF、压缩包和常见图片；文件仅保存在本地浏览器，单文件上限 1 MB。</p><label class="field"><span>选择照片或文件</span><input name="file" type="file" accept=".txt,.md,.json,.csv,.xlsx,.pdf,.zip,.png,.jpg,.jpeg,.webp,.gif" required></label><div class="form-error" role="alert"></div><div class="form-actions">${btn('取消','close')}<button class="btn primary" type="submit">添加</button></div></form>`;
 function resourceForm(context){
  const selected=composerSelection(context),allowed=canUseResources(),tools=allowed?state.tools.filter(tool=>tool.status==='已发布'):[],skills=allowed?state.skills.filter(skill=>!String(skill.status).includes('停用')):[];
  const rows=[...tools.map(tool=>`<label class="ss-resource-option"><input type="checkbox" name="tools" value="${esc(tool.id)}" ${selected.tools.includes(tool.id)?'checked':''}><span><strong>${esc(tool.name)}</strong><small>${esc(tool.category)} · ${esc(tool.permission)}</small></span>${tag(tool.status,'success')}</label>`),...skills.map(skill=>`<label class="ss-resource-option"><input type="checkbox" name="skills" value="${esc(skill.id)}" ${selected.skills.includes(skill.id)?'checked':''}><span><strong>${esc(skill.name)}</strong><small>Skill · ${esc(skill.permission)}</small></span>${tag(skill.status)}</label>`)].join('');
  return `<form id="super-composer-tools-form"><input type="hidden" name="context" value="${context}"><p class="muted">仅显示当前用户权限范围内可用的工具和 Skill，可多选并与文件同时添加。</p><div class="ss-resource-list">${rows||'<p class="ss-empty">当前身份没有可添加的工具或 Skill。</p>'}</div><div class="form-error" role="alert"></div><div class="form-actions">${btn('取消','close')}<button class="btn primary" type="submit" ${allowed?'':'disabled'}>确认添加</button></div></form>`;
 }

 let progressHideTimer;
 function scheduleCompletedProgressHide(){
  clearTimeout(progressHideTimer);if(isNewTaskPage())return;const query=ss().query,taskProgress=getSuperSearchTaskProgress(query);if(taskProgress.phase!=='done'||!taskProgress.visible)return;
  const remaining=Math.max(0,640-(Date.now()-(query.progressCompletedAt||Date.now())));progressHideTimer=setTimeout(()=>{if(route()==='PG05')update();},remaining);
 }
 const update=message=>{
  const view=captureSuperSearchView(),focused=document.activeElement,permission=focused?.dataset.superPermission;
  commit(message);
  const drawer=document.querySelector('#overlay .ss-workspace');
  if(drawer){drawer.outerHTML=renderSuperSearchWorkspace(undefined,workspaceOptions());fitEntityGraphs(document.querySelector('#overlay'));restoreSuperSearchView(view);if(permission)document.querySelector(`#overlay [data-super-permission="${permission}"]`)?.focus({preventScroll:true});}
  scheduleCompletedProgressHide();
 };
 function locate(toolId){const tool=getSuperSearchTool(toolId);if(!tool)throw Error('来源工具不可用。');selectSuperQuery(tool.queryId);const s=ss();s.activeTab='工作空间';if(!s.ui.expandedAgents.includes(tool.agentId))s.ui.expandedAgents.push(tool.agentId);const task=s.query.subtasks.find(item=>item.id===tool.subtaskId),groupId=task?.parentId||task?.id;if(groupId&&!s.ui.expandedSubtasks.includes(groupId))s.ui.expandedSubtasks.push(groupId);if(!s.ui.expandedTools.includes(tool.id))s.ui.expandedTools.push(tool.id);s.ui.highlightTool=tool.id;s.ui.highlightUntil=Date.now()+1800;openWorkspace();update();scrollToSource(`[data-tool-id="${tool.id}"]`);setTimeout(()=>{document.querySelectorAll(`[data-tool-id="${tool.id}"]`).forEach(e=>e.classList.remove('is-highlighted'));if(s.ui.highlightTool===tool.id)s.ui.highlightTool=null;},1850);const panel=document.querySelector('.super-search-page .ss-workspace');if(panel&&!panel.getClientRects().length&&!document.querySelector('#overlay .ss-workspace'))modal('研判空间',renderSuperSearchWorkspace(undefined,workspaceOptions()),{drawer:true});}
 function focusArtifact(a){
  const s=ss();s.activeTab='文档空间';
  for(const id of [a.sourceType==='user_upload'?'UPLOAD':a.queryId,a.folder,...(a.folderPath?.length>1?[a.folderPath.join('/')]:[])].filter(Boolean))if(!s.ui.expandedFolders.includes(id))s.ui.expandedFolders.push(id);
  s.ui.highlightArtifact=a.id;openWorkspace();update();scrollToSource(`[data-artifact-id="${a.id}"]`);
 }
 function graphObject(id){return ss().entities.find(e=>e.id===id)||ss().relations.find(r=>r.id===id);}
 Object.assign(actions,{
  'super-pane-collapse':el=>{const pane=el.dataset.pane;if(pane==='right'){if(el.closest('#overlay'))actions.close();syncWorkspaceExpanded(false);return;}layout().leftCollapsed=true;update();document.querySelector('.ss-expand-left')?.focus();},
  'super-pane-expand':el=>{const pane=el.dataset.pane;if(pane==='right'){openWorkspace();return;}layout().leftCollapsed=false;update();if(matchMedia('(max-width:900px)').matches)modal('任务列表',renderSuperSearchSidebar(sidebarOptions()),{drawer:true});requestAnimationFrame(()=>surface('[data-action="super-pane-collapse"][data-pane="left"]')?.focus());},
  'super-session-open':el=>{closeSessionMenu();materializeHistoricalSession(el.dataset.id);if(el.closest('#overlay'))actions.close();actions['open-session'](el);},
  'super-session-menu':el=>{layout().sessionMenuId=layout().sessionMenuId===el.dataset.id?null:el.dataset.id;update();const drawer=document.querySelector('#overlay .ss-sidebar');if(drawer)drawer.outerHTML=renderSuperSearchSidebar(sidebarOptions());surface('.ss-session-menu button')?.focus();},
  'super-session-pin':el=>{toggleSuperSearchList(layout().pinnedSessions,el.dataset.id);closeSessionMenu();update();const drawer=document.querySelector('#overlay .ss-sidebar');if(drawer)drawer.outerHTML=renderSuperSearchSidebar(sidebarOptions());},
  'super-session-rename':el=>{closeSessionMenu();materializeHistoricalSession(el.dataset.id);actions['rename-session'](el);},
  'super-session-archive':el=>{closeSessionMenu();materializeHistoricalSession(el.dataset.id);actions['archive-session'](el);},
  'super-workspace-tab':el=>{if(isNewTaskPage())layout().newTaskTab=el.dataset.tab;else ss().activeTab=el.dataset.tab;update();},
  'super-turn-toggle':el=>{const ui=ss().ui,id=el.dataset.id,isExpanded=el.getAttribute('aria-expanded')==='true';if(isExpanded){if(!ui.collapsedTurns.includes(id))ui.collapsedTurns.push(id);ui.expandedTurns=ui.expandedTurns.filter(turnId=>turnId!==id);}else{ui.collapsedTurns=ui.collapsedTurns.filter(turnId=>turnId!==id);if(!ui.expandedTurns.includes(id))ui.expandedTurns.push(id);}update();},
  'super-scroll-latest':el=>{const state=ss(),messages=document.querySelector('.super-search-page .ss-messages');state.ui.followLatest=true;state.ui.hasNewProgress=false;if(messages){messages.scrollTop=messages.scrollHeight;state.ui.messageScrollTop=messages.scrollTop;}el.classList.add('is-hidden');persist();},
  'super-plan-confirm':()=>{if(confirmSuperQueryPlan())update('执行计划已确认，调度器开始按依赖顺序运行。');},
  'super-query-stop':el=>{if(requestStopSuperQuery(el.dataset.queryId))update('已请求终止 Query；正在取消运行中的工具。');},
  'super-query-replan':el=>{if(ss().queries.find(r=>r.query.id===el.dataset.queryId)?.query.historical){toast('历史执行快照保持只读；请在下方继续追问，发起新一轮研判。');return;}if(replanSuperQuery('用户调整后续范围与分析重点',el.dataset.queryId))update('已生成新的 Query 级计划版本，请确认后执行。');},
  'super-resume-query':el=>{if(resumeSuperSearchQuery(el.dataset.queryId))update('已从授权检查点恢复 Query。');},
  'super-open-fund-analysis':el=>{state.superSearchFundContext={sessionKey:state.sessionId,queryId:el.dataset.queryId,artifactId:el.dataset.id};persist();go?.('PG09');},
  'super-permission-toggle':()=>{ss().ui.permissionExpanded=!ss().ui.permissionExpanded;update();},
  'super-permission-apply':el=>{const applications=requestSuperSearchPermission(el.dataset.id||'all');if(applications?.length){update('权限申请已提交；审批、激活和 Query 恢复将分别完成。');go?.('PG26');}},
  'super-permission-cancel':el=>{if(cancelSuperSearchPermission(el.dataset.id||'all'))update('已取消选中的权限申请，可在对应子任务下重新申请。');},
  'super-permission-reopen':el=>{reopenSuperPermission(el.dataset.id);update('已重新创建待处理申请。');},
  'super-subtask-toggle':el=>{toggleSuperSearchList(ss().ui.expandedSubtasks,el.dataset.id);update();},
  'super-agent-toggle':el=>{toggleSuperSearchList(ss().ui.expandedAgents,el.dataset.id);update();},
  'super-action-tab':el=>{ss().ui.actionTabs ||= {};ss().ui.actionTabs[el.dataset.id]=el.dataset.tab;update();},
  'super-tool-toggle':el=>{toggleSuperSearchList(ss().ui.expandedTools,el.dataset.id);update();},
  'super-folder-toggle':el=>{toggleSuperSearchList(ss().ui.expandedFolders,el.dataset.id);update();},
  'super-tool-control':el=>{controlSuperTool(el.dataset.id,el.dataset.control);update();},
  'super-task-source':el=>{const run=ss().queries.find(item=>item.query.id===el.dataset.queryId)||ss().queries.find(item=>item.query.subtasks.some(task=>task.id===el.dataset.id)),tools=run?.agents.flatMap(agent=>agent.toolCalls)||[],tool=tools.find(item=>item.subtaskId===el.dataset.id&&item.status!=='done')||tools.find(item=>item.subtaskId===el.dataset.id);if(tool)locate(tool.id);},
  'super-file-locate':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(a?.toolCallId)locate(a.toolCallId);},
  'super-artifact-focus':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(a)focusArtifact(a);},
  'super-file-preview':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(!a)throw Error('未找到文件。');if(['fund-v2','network-v1','person-v1'].includes(a.fixture))focusArtifact(a);const t=a.toolCallId?getSuperSearchTool(a.toolCallId):null;modal(a.name,`<div class="ss-preview"><div class="ss-preview-meta">${tag(a.type)}${tag(a.sourceType==='user_upload'?'用户上传':'合成示例')}${btn('下载文件','super-file-download',`data-id="${a.id}"`,'small')}</div>${artifactPreview(a)}<dl class="ss-preview-source"><div><dt>来源 Subtask</dt><dd>${esc(a.subtaskId||'用户上传')}</dd></div><div><dt>生成 Action</dt><dd>${esc(t?`${t.agentId==='data-analysis-agent'?'数据分析 Agent':'信息获取 Agent'} → ${t.toolId}`:'用户上传原始材料')}</dd></div><div><dt>创建时间</dt><dd>${esc(a.createdAt||'—')}</dd></div><div><dt>数据范围</dt><dd>${esc(a.dataScope||'用户提供的原始材料')}</dd></div><div><dt>记录数</dt><dd>${esc(a.recordCount??'—')}${a.sourceRecordCount?`（关键摘录；历史源返回 ${a.sourceRecordCount.toLocaleString()} 条）`:''}</dd></div><div><dt>生成状态</dt><dd>${esc(a.generationStatus||'已就绪')}</dd></div><div><dt>校验摘要</dt><dd>${esc(a.validationSummary||'原始材料保留')}</dd></div></dl></div>`,{wide:true});},
  'super-file-download':async el=>{await downloadSuperArtifact(getSuperSearchArtifact(el.dataset.id));},
  'super-entity-detail':el=>{if(!getSuperSearchEntity(el.dataset.id))return;ss().graph.selected=el.dataset.id;ss().graph.selectedRelation=null;ss().ui.selectedEntityId=el.dataset.id;update();},
  'super-relation-detail':el=>{if(!ss().relations.some(r=>r.id===el.dataset.id))return;ss().graph.selectedRelation=el.dataset.id;update();scrollToSource('.ss-entity-detail');},
  'super-graph-context':el=>{const obj=graphObject(el.dataset.id);if(!obj)return;const from=ss().entities.find(e=>e.id===obj.from),to=ss().entities.find(e=>e.id===obj.to),label=obj.from?`${from?.title||from?.name} → ${to?.title||to?.name} · ${obj.label||obj.type}`:obj.name;const chips=ss().ui.contextChips;if(!chips.some(c=>c.id===obj.id))chips.push({id:obj.id,label,kind:obj.from?'relation':'entity',sourceRefs:structuredClone(obj.sourceRefs||[])});update();document.querySelector('#super-search-prompt')?.focus();},
  'super-graph-evidence':el=>{const state=ss(),obj=graphObject(el.dataset.id);if(!obj)return;const refs=[...new Set((obj.sourceRefs||[]).map(r=>r.artifactId).filter(Boolean))].map(getSuperSearchArtifact).filter(Boolean);if(!refs.length){toast('该实体或关系暂无可定位的证据文件。');return;}const focused=['network-v1','person-v1'].includes(state.fixture);if(focused)focusArtifact(refs[0]);modal('关联证据',`<div class="ss-file-tree"><p class="muted small">${focused?'已在文档空间定位第一条证据。':'选择证据文件可在文档空间查看。'}</p>${refs.map(a=>`<div class="ss-tool-artifact"><button class="ss-artifact-name" data-action="super-file-preview" data-id="${a.id}">${esc(a.name)}</button></div>`).join('')}</div>`);},
  'super-entity-profile':el=>{const obj=getSuperSearchEntity(el.dataset.id);if(obj)modal(obj.name,`<div class="ss-entity-detail"><dl>${Object.entries(obj.properties).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`);},
  'super-entity-source':el=>{if(el.dataset.toolId)locate(el.dataset.toolId);},
  'super-recommend':el=>{ss().draft=el.dataset.query;update();document.querySelector('#super-search-prompt')?.focus();},
  'super-recommend-refresh':el=>{const state=ss(),run=state.queries.find(item=>item.query.id===el.dataset.queryId),count=run?.query.recommendedQueries?.length||0;if(count>1){state.ui.recommendationOffsets ||= {};state.ui.recommendationOffsets[el.dataset.queryId]=((state.ui.recommendationOffsets[el.dataset.queryId]||0)+1)%count;update();}},
  'super-composer-menu':el=>{const context=el.dataset.context,current=layout();current.composerMenuOpen=current.composerMenuOpen===context?null:context;update();if(current.composerMenuOpen)requestAnimationFrame(()=>surface(`.ss-query-composer[data-composer-context="${context}"] .ss-composer-menu button`)?.focus());},
  'super-composer-upload':el=>{const context=el.dataset.context;layout().composerMenuOpen=null;update();modal('添加照片和文件',uploadForm(context));},
  'super-composer-tools':el=>{const context=el.dataset.context;layout().composerMenuOpen=null;update();modal('工具和Skills',resourceForm(context),{wide:true});},
  'super-composer-deep':el=>{const context=el.dataset.context,current=layout(),enabled=!current.deepThinking[context],switchEl=el.querySelector('.ss-switch');current.deepThinking[context]=enabled;persist();el.setAttribute('aria-checked',String(enabled));switchEl?.classList.toggle('on',enabled);if(switchEl&&!matchMedia('(prefers-reduced-motion:reduce)').matches){switchEl.classList.remove('is-changing');void switchEl.offsetWidth;switchEl.classList.add('is-changing');setTimeout(()=>switchEl.classList.remove('is-changing'),300)}el.focus({preventScroll:true});},
  'super-upload':()=>{modal('上传会话材料',`<form id="super-search-upload"><p class="muted">材料仅保存在本地浏览器，不上传至服务器。单文件上限 1 MB。</p><label class="field"><span>选择文件</span><input name="file" type="file" accept=".txt,.md,.json,.csv,.xlsx,.pdf,.zip,.png,.jpg,.jpeg,.webp,.gif" required></label><div class="form-error" role="alert"></div><div class="form-actions">${btn('取消','close')}<button class="btn primary" type="submit">添加到文档空间</button></div></form>`);}
 });
 for(const name of ['node-select','node-more','node-execution','node-zoom','node-fit']){const original=actions[name];actions[name]=el=>{if(el.dataset.graphId!=='superSearch'&&el.closest('[data-graph]')?.dataset.graph!=='superSearch')return original(el);if(name==='node-zoom'||name==='node-fit'){const graph=el.closest('.ss-workspace').querySelector('[data-graph]');ss().graph.zoom=name==='node-fit'?'fit':Math.max(.35,Math.min(1.5,Number(graph?.dataset.scale||1)+Number(el.dataset.delta)));update();}else if(name==='node-execution'){const entity=getSuperSearchEntity(el.dataset.id);if(entity?.sourceRefs[0]?.toolCallId)locate(entity.sourceRefs[0].toolCallId);}else actions['super-entity-detail'](el);};}
 forms['super-scope-form']=data=>{const person=ss().query.kind==='person';const sources=['基础档案',...(data.get('includeRestricted')?(person?['轨迹记录','关联场所']:['银行流水','第三方支付']):['公开及已授权来源'])];if(confirmSuperQueryScope({subject:String(data.get('subject')||'').trim(),startDate:String(data.get('startDate')||''),endDate:String(data.get('endDate')||''),sources}))update('研判范围已确认，请核对执行计划。');};
 forms['super-search-composer']=data=>{if(!state.permission||!state.loggedIn)throw Error('当前账号不能发起研判任务。');if(!canStartSuperQuery())throw Error('当前最新一轮尚未进入终态。');const text=String(data.get('prompt')||'').trim();if(!text||text.length>2000)throw Error('请输入 1–2000 字的研判问题。');const selection=composerSelection('history'),deepThinking=layout().deepThinking.history;startSuperQuery(text,{deepThinking,tools:selection.tools,skills:selection.skills,files:selection.files,contextChips:structuredClone(ss().ui.contextChips)});ss().ui.contextChips=[];ss().ui.followLatest=true;ss().ui.hasNewProgress=false;update(ss().query.historicalFollowup?'已保留追问上下文；此历史 Demo 未启动新的调证。':deepThinking?'已创建新一轮，请先确认范围和计划。':'已按普通问答模式完成，未启动深度研判。');requestAnimationFrame(()=>{const messages=document.querySelector('.ss-messages');if(messages){messages.scrollTop=messages.scrollHeight;ss().ui.messageScrollTop=messages.scrollTop;}});};
 forms['super-search-upload']=async data=>{const a=await uploadSuperFile(data.get('file'),ss());if(a){actions.close();update('文件已加入本会话的用户上传目录。');}};
 forms['super-composer-upload-form']=async data=>{const context=String(data.get('context')),file=data.get('file');if(!file?.name)throw Error('请选择要添加的文件。');let item;if(context==='history'){item=await uploadSuperFile(file,ss());}else{if(file.size>1024*1024)throw Error('文件超过 1 MB 上限。');const type=file.name.split('.').pop().toUpperCase();if(!['TXT','MD','JSON','CSV','XLSX','PDF','ZIP','PNG','JPG','JPEG','WEBP','GIF'].includes(type))throw Error('不支持该文件格式。');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('文件读取失败'));reader.readAsDataURL(file);});item={id:uid('OBJ'),name:file.name,type,status:'Ready',size:`${(file.size/1024).toFixed(1)} KB`,version:1,source:'用户上传',session:null,org:state.org,raw:true,archived:false,dataUrl};if(['TXT','MD','JSON','CSV'].includes(type))item.content=await file.text();state.files.push(item);}
  if(item&&!composerSelection(context).files.includes(item.id))composerSelection(context).files.push(item.id);actions.close();update('文件已添加到 Query。');};
 forms['super-composer-tools-form']=data=>{const context=String(data.get('context'));if(!canUseResources())throw Error('当前身份没有添加工具或 Skill 的权限。');const selection=composerSelection(context);selection.tools=data.getAll('tools').filter(id=>state.tools.some(tool=>tool.id===id&&tool.status==='已发布'));selection.skills=data.getAll('skills').filter(id=>state.skills.some(skill=>skill.id===id&&!String(skill.status).includes('停用')));actions.close();update('工具和 Skill 已更新。');};
 let scrollPersistTimer;
 const scrollbarTimers=new WeakMap();
 document.addEventListener('scroll',e=>{
  const scrollable=e.target?.closest?.('.super-search-page .ss-session-list,.super-search-page .ss-messages,.super-search-page .ss-right-content,.super-search-page .ss-preview-content,.super-search-page .ss-code-panel,.super-search-page .ss-table-preview,.super-search-page .entity-viewport');
  if(scrollable){scrollable.classList.add('is-scrolling');clearTimeout(scrollbarTimers.get(scrollable));scrollbarTimers.set(scrollable,setTimeout(()=>scrollable.classList.remove('is-scrolling'),700));}
  const messages=e.target?.closest?.('.super-search-page .ss-messages');if(!messages)return;const state=ss(),nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<=80;state.ui.messageScrollTop=messages.scrollTop;state.ui.followLatest=nearBottom;if(nearBottom)state.ui.hasNewProgress=false;const latestButton=document.querySelector('.ss-latest-button');if(latestButton)latestButton.classList.toggle('is-hidden',nearBottom&&!state.ui.hasNewProgress);clearTimeout(scrollPersistTimer);scrollPersistTimer=setTimeout(()=>persist(),80);
 },true);
 document.addEventListener('input',e=>{if(e.target.id==='prompt'&&e.target.closest('.ss-new-task'))growComposer();if(e.target.id==='super-history-search'){layout().historySearch=e.target.value;closeSessionMenu();const root=e.target.closest('.ss-sidebar'),query=e.target.value.toLocaleLowerCase();let count=0;root.querySelectorAll('.ss-session-row').forEach(row=>{row.hidden=!(row.dataset.search||'').includes(query);if(!row.hidden)count++;});root.querySelector('.ss-history-empty').hidden=!!count;persist();return;}if(e.target.id!=='super-search-prompt')return;growComposer();ss().draft=e.target.value;const send=document.querySelector('#super-search-composer [type=submit]');if(send)send.disabled=!e.target.value.trim()||!canStartSuperQuery();persist();});
 document.addEventListener('change',e=>{const id=e.target.dataset.superPermission;if(!id)return;const list=ss().ui.selectedPermissions;const index=list.indexOf(id);if(e.target.checked&&index<0)list.push(id);if(!e.target.checked&&index>=0)list.splice(index,1);update();});
 document.addEventListener('focusin',e=>{if(['PG04','PG05'].includes(route())&&layout().sessionMenuId&&!e.target.closest('.ss-session-row'))closeSessionMenu();});
 document.addEventListener('click',e=>{if(!['PG04','PG05'].includes(route()))return;if(!e.target.closest('.ss-session-row'))closeSessionMenu();if(layout().composerMenuOpen&&!e.target.closest('.ss-query-composer'))closeComposerMenu();});
 document.addEventListener('keydown',e=>{
  if(['PG04','PG05'].includes(route())&&e.key==='Escape'&&layout().composerMenuOpen&&!document.querySelector('#overlay')?.children.length){e.preventDefault();closeComposerMenu(true);return;}
  if(['PG04','PG05'].includes(route())&&e.key==='Escape'&&layout().sessionMenuId){const id=layout().sessionMenuId;closeSessionMenu();surface(`[data-action="super-session-menu"][data-id="${id}"]`)?.focus();}
  if(e.target.closest('.ss-session-menu')&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.target.closest('.ss-session-menu').querySelectorAll('button')],index=items.indexOf(e.target);items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}

  if(e.target.id==='super-search-prompt'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();e.target.form.requestSubmit();}
  if(e.target.matches('.ss-workspace [role=tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...e.target.parentElement.children];const index=e.key==='Home'?0:e.key==='End'?2:(tabs.indexOf(e.target)+(e.key==='ArrowRight'?1:2))%3;const tab=tabs[index].dataset.tab,inDrawer=!!e.target.closest('#overlay');if(isNewTaskPage())layout().newTaskTab=tab;else ss().activeTab=tab;update();document.querySelector(`${inDrawer?'#overlay ':'.super-search-page '}.ss-workspace [data-tab="${tab}"]`)?.focus();}
 });
 // Native pan/zoom stays isolated to the entity canvas, never the conversation scroll.
 let workspaceResize=null;
 const setWorkspaceWidth=value=>{
  const page=document.querySelector('.ss-rich-history');if(!page)return;
  const left=Number.parseFloat(getComputedStyle(page).getPropertyValue('--ss-left'))||0;
  const width=Math.round(Math.max(400,Math.min(innerWidth-left-480,value)));
  ss().ui.workspaceWidth=width;page.style.setProperty('--ss-fund-width',width+'px');
  const handle=page.querySelector('.ss-workspace-resizer');handle?.setAttribute('aria-valuenow',String(width));
  requestAnimationFrame(()=>{fitEntityGraphs(page);fitFundHistoryGraphs();});
 };
 document.addEventListener('pointerdown',e=>{const handle=e.target.closest('.ss-workspace-resizer');if(!handle||e.button!==0)return;e.preventDefault();workspaceResize={x:e.clientX,width:handle.parentElement.getBoundingClientRect().width};handle.setPointerCapture(e.pointerId);document.querySelector('.ss-rich-history')?.classList.add('ss-rich-resizing');});
 document.addEventListener('pointermove',e=>{if(workspaceResize)setWorkspaceWidth(workspaceResize.width+workspaceResize.x-e.clientX);});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{if(!workspaceResize)return;workspaceResize=null;document.querySelector('.ss-rich-history')?.classList.remove('ss-rich-resizing');persist();});
 document.addEventListener('keydown',e=>{if(!e.target.matches('.ss-workspace-resizer')||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();setWorkspaceWidth(e.target.parentElement.getBoundingClientRect().width+(e.key==='ArrowLeft'?24:-24));persist();});
 let pan=null;
 document.addEventListener('pointerdown',e=>{const viewport=e.target.closest('.ss-graph-canvas .entity-viewport');if(!viewport||e.target.closest('.entity-node,.ss-edge-hit')||e.button!==0)return;pan={viewport,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-panning');});
 document.addEventListener('pointermove',e=>{if(!pan)return;pan.viewport.scrollLeft=pan.left-(e.clientX-pan.x);pan.viewport.scrollTop=pan.top-(e.clientY-pan.y);});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{pan?.viewport.classList.remove('is-panning');pan=null;});
 const hover=(e,on)=>{const node=e.target.closest('.ss-graph-canvas .entity-node');if(!node||node.contains(e.relatedTarget))return;const s=ss(),edges=node.closest('.entity-graph').querySelectorAll('.entity-edges path:not(.ss-edge-hit)');node.closest('.entity-graph').classList.toggle('ss-graph-hover',on);s.relations.forEach((r,i)=>edges[i]?.classList.toggle('ss-edge-active',on&&(r.from===node.dataset.nodeId||r.to===node.dataset.nodeId)));};
 document.addEventListener('mouseover',e=>hover(e,true));document.addEventListener('mouseout',e=>hover(e,false));
 window.addEventListener('resize',()=>requestAnimationFrame(fitFundHistoryGraphs));
 scheduleCompletedProgressHide();
 setInterval(()=>{if(!state.loggedIn||!state.permission||!state.network)return;if(tickSuperSearch()){const state=ss();if(!state.ui.followLatest)state.ui.hasNewProgress=true;persist();if(route()==='PG05'){const overlay=document.querySelector('#overlay');if(!overlay.children.length||overlay.querySelector('.ss-workspace'))update();}}},450);
}
