import {state,current} from './state.js';
import {esc,icon,btn,tag} from './ui.js';
import {entityGraph} from './entity-node.js';
import {ensureSuperSearchState,ensureHistoricalSessions,getSuperSearchArtifact,getSuperSearchTool,allQueryRuns,ensureSuperSearchLayout,canStartSuperQuery,getSuperSearchTaskProgress} from './super-search-model.js';
export {ensureSuperSearchState,getSuperSearchArtifact,getSuperSearchTool,getSuperSearchEntity,approveSuperSearchPermission,completeSuperSearchPermissionFlow,cancelSuperSearchPermission,confirmSuperQueryScope,confirmSuperQueryPlan,requestStopSuperQuery,replanSuperQuery,requestSuperSearchPermission,resumeSuperSearchQuery,getSuperSearchFundProjection} from './super-search-model.js';

const isRichHistory=ss=>['fund-v2','network-v1','person-v1'].includes(ss?.fixture);
const STATUS_COPY={pending:'待执行',awaiting_scope:'待确认范围',awaiting_plan:'待确认计划',running:'执行中',done:'已完成',reused:'已复用',failed:'失败',partial_success:'部分成功',waiting_approval:'等待授权',stopping:'正在终止',terminated:'已终止',canceling:'正在取消',paused:'已暂停',suspended:'已暂停',canceled:'已取消',dependency_blocked:'等待前置任务'};
const STATUS_ICON={done:'check',reused:'check',running:'clock',awaiting_scope:'search',awaiting_plan:'folder-tree',waiting_approval:'shield',stopping:'pause',terminated:'close',canceling:'pause',partial_success:'warning',failed:'close',paused:'pause',canceled:'close',pending:'clock',dependency_blocked:'clock'};
const statusText=status=>STATUS_COPY[status]||status;
function statusMark(status){return `<span class="ss-status-mark ${status}" aria-hidden="true">${icon(STATUS_ICON[status]||'clock')}</span>`;}
function statusTag(status){return tag(statusText(status),['done','reused'].includes(status)?'success':status==='running'?'blue':['failed','terminated'].includes(status)?'danger':['awaiting_scope','awaiting_plan','waiting_approval','stopping','partial_success','paused','suspended'].includes(status)?'warning':'neutral');}
// PG05-only icons; shared navigation and icon definitions remain untouched.
export function superIcon(name){
 const paths={panel:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 3v18"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',source:'<path d="M5 3v9a5 5 0 0 0 5 5h10m-5-5 5 5-5 5"/>',attach:'<path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2m-7 13 9-9"/>',send:'<path d="m21 3-7 18-4-8-8-4 19-6Z M10 13l6-6"/>'};
 return `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.panel}</svg>`;
}
const difyIcon=name=>`<span class="ss-dify-icon ss-dify-icon-${name}" aria-hidden="true"></span>`;
const workspaceIcon=name=>`<span class="ss-workspace-icon ss-workspace-icon-${name}" aria-hidden="true"></span>`;
const difyEntityIcon=category=>`<span class="ss-dify-entity-icon ss-dify-entity-icon-${category}" aria-hidden="true"></span>`;
function composerSelection(context){return ensureSuperSearchLayout().composerSelections[context];}
function composerChips(context,ss){
 const selection=composerSelection(context),items=[];
 for(const id of selection.files){const item=state.files.find(file=>file.id===id)||ss?.artifacts?.find(file=>file.id===id);if(item)items.push(['file',item.name]);}
 for(const id of selection.tools){const item=state.tools.find(tool=>tool.id===id);if(item)items.push(['tools',item.name]);}
 for(const id of selection.skills){const item=state.skills.find(skill=>skill.id===id);if(item)items.push(['brain',item.name]);}
 for(const chip of ss?.ui?.contextChips||[])items.push(['source',chip.label]);
 return items.length?`<div class="ss-composer-chips" aria-label="已添加的文件、工具、Skills 和导图上下文">${items.map(([kind,label])=>`<span>${difyIcon(kind)}${esc(label)}</span>`).join('')}</div>`:'';
}
function renderQueryComposer({context,formId,textareaId,value='',placeholder,disabled=false,sendDisabled=false,ss}){
 const layout=ensureSuperSearchLayout(),open=layout.composerMenuOpen===context,deep=layout.deepThinking[context];
 return `<form class="composer ss-query-composer" id="${formId}" data-composer-context="${context}">${open?`<div class="ss-composer-menu" role="menu" aria-label="添加到 Query"><button type="button" role="menuitem" data-action="super-composer-upload" data-context="${context}">${difyIcon('image')}<span>添加照片和文件</span></button><button type="button" role="menuitem" data-action="super-composer-tools" data-context="${context}">${difyIcon('tools')}<span>工具和Skills</span></button><button type="button" class="ss-deep-thinking-row" role="switch" aria-checked="${deep}" data-action="super-composer-deep" data-context="${context}">${difyIcon('brain')}<span>深度思考</span><i class="ss-switch ${deep?'on':''}" aria-hidden="true"><b></b></i></button></div>`:''}${composerChips(context,ss)}<div class="composer-inner"><button class="btn ghost icon-only ss-composer-trigger" type="button" data-action="super-composer-menu" data-context="${context}" aria-label="添加照片、文件、工具或 Skill" title="添加内容" aria-haspopup="menu" aria-expanded="${open}">${difyIcon('attach')}</button><textarea id="${textareaId}" name="prompt" rows="1" maxlength="2000" aria-label="研判问题" aria-description="Enter 发送，Shift+Enter 换行" placeholder="${esc(placeholder)}" ${disabled?'disabled':''}>${esc(value)}</textarea><button class="btn ghost icon-only" type="submit" aria-label="发送研判问题" title="发送" ${sendDisabled?'disabled':''}>${difyIcon('send')}</button></div><div class="form-error" role="alert"></div></form>`;
}
export function renderSuperSearchSidebar(options={}){
 const historical=ensureHistoricalSessions(),layout=ensureSuperSearchLayout(),session=options.newTask?null:current(),filter=layout.historySearch.toLocaleLowerCase();
 const historyPriority=item=>item.historicalFixture==='person-v1'?3:item.historicalFixture==='network-v1'?2:item.historicalFixture==='fund-v2'?1:0;
 const sessions=[...state.sessions.filter(item=>item.org===state.org),...historical.filter(item=>!state.sessions.some(session=>session.id===item.id&&session.org===state.org))].filter(item=>!item.archived).sort((a,b)=>Number(layout.pinnedSessions.includes(b.id))-Number(layout.pinnedSessions.includes(a.id))||historyPriority(b)-historyPriority(a));
 return `<aside class="ss-sidebar" aria-label="任务列表"><header class="ss-sidebar-head"><h2>任务列表</h2>${btn(superIcon('panel'),'super-pane-collapse','data-pane="left" aria-label="收起任务列表" title="收起任务列表"','ghost icon-only')}</header>
 ${btn('新任务','new-search','','primary full','plus')}
 <label class="ss-history-search"><input id="super-history-search" value="${esc(layout.historySearch)}" placeholder="搜索历史对话" aria-label="搜索历史对话" autocomplete="off">${icon('search')}</label>
 <div class="ss-session-list">${sessions.map(item=>`<div class="ss-session-row ${session?.id===item.id?'active':''}" data-session-id="${esc(item.id)}" data-search="${esc(`${item.title} ${item.listSubtitle||''}`.toLocaleLowerCase())}" ${`${item.title} ${item.listSubtitle||''}`.toLocaleLowerCase().includes(filter)?'':'hidden'}><button class="ss-session-open" data-action="super-session-open" data-id="${esc(item.id)}" ${session?.id===item.id?'aria-current="page"':''} title="${esc(item.title)}">${layout.pinnedSessions.includes(item.id)?'<span class="ss-pin" title="已置顶">置顶</span>':''}<span class="ss-session-copy"><span>${esc(item.title)}</span></span></button>${btn(superIcon('more'),'super-session-menu',`data-id="${esc(item.id)}" aria-label="操作对话：${esc(item.title)}" aria-expanded="${layout.sessionMenuId===item.id}" aria-haspopup="menu"`,'ghost icon-only ss-session-more')}${layout.sessionMenuId===item.id?`<div class="ss-session-menu" role="menu" aria-label="对话操作">${[['rename','重命名'],['pin',layout.pinnedSessions.includes(item.id)?'取消置顶':'置顶'],['archive','归档']].map(([action,label])=>`<button role="menuitem" data-action="super-session-${action}" data-id="${esc(item.id)}">${label}</button>`).join('')}</div>`:''}</div>`).join('')}<p class="ss-history-empty" ${sessions.some(item=>`${item.title} ${item.listSubtitle||''}`.toLocaleLowerCase().includes(filter))?'hidden':''}>${sessions.length?'未找到对话':'暂无对话'}</p></div></aside>`;
}
function paneControls(){
 return `<div class="ss-pane-controls">${btn(superIcon('panel'),'super-pane-expand','data-pane="left" aria-label="展开任务列表" title="展开任务列表"','ghost icon-only ss-expand-left')}</div>`;
}

function workspaceProgress(progressState){
 if(!progressState.visible)return '';
 const value=progressState.determinate?` aria-valuemin="0" aria-valuemax="${progressState.total}" aria-valuenow="${progressState.phase==='done'?progressState.total:progressState.completed}"`:'';
 const style=progressState.determinate?` style="--ss-workspace-progress:${progressState.percent}%"`:'';
 return `<span class="ss-workspace-progress is-${progressState.phase} ${progressState.determinate?'':'is-indeterminate'}" role="progressbar" aria-label="${esc(progressState.tooltip.replace(/\n/g,'，'))}"${value}${style}><i></i></span>`;
}

function workspaceLauncher(ss,expanded){
 const taskProgress=ss?getSuperSearchTaskProgress(ss.query):{visible:false},tooltip=taskProgress.visible?taskProgress.tooltip:'查看研判空间';
 return `<div class="ss-workspace-launcher-wrap"><button class="ss-workspace-launcher ss-expand-right" data-action="super-pane-expand" data-pane="right" aria-label="${esc(tooltip.replace(/\n/g,'，'))}" aria-expanded="${expanded}" title="${esc(tooltip)}"><span class="ss-workspace-launcher-art" aria-hidden="true"><img class="ss-workspace-launcher-icon ss-workspace-launcher-icon-light" src="/assets/super-search/workspace.svg" alt=""><img class="ss-workspace-launcher-icon ss-workspace-launcher-icon-dark" src="/assets/super-search/workspace-dark.svg" alt=""></span></button>${workspaceProgress(taskProgress)}</div>`;
}


function conversationState(status){
 if(['done','reused'].includes(status))return 'done';
 if(['waiting_approval'].includes(status))return 'approval';
 if(['dependency_blocked','awaiting_scope','awaiting_plan'].includes(status))return 'waiting';
 if(['failed','partial_success','terminated','canceled'].includes(status))return 'failed';
 return 'running';
}
function conversationStatusBadge(status){
 const state=conversationState(status),labels={done:'已完成',running:'执行中',approval:'等待授权',waiting:status==='dependency_blocked'?'等待前置任务':'等待确认',failed:status==='partial_success'?'部分完成':'失败'};
 return `<span class="ss-conversation-status is-${state}"><i aria-hidden="true"></i>${labels[state]}</span>`;
}
function taskStatusTitle(status,complete,total){
 const state=conversationState(status);
 if(state==='done')return '任务已完成';
 if(state==='approval')return '任务等待授权';
 if(state==='waiting')return status==='dependency_blocked'?'任务等待前置任务':'任务等待确认';
 if(state==='failed')return status==='partial_success'?'任务部分完成':'任务执行失败';
 return total&&complete?`任务执行中 · ${complete} / ${total}`:'任务执行中';
}
function conversationActionButton(label,action,extra='',variant='secondary',ico=''){
 return btn(label,action,extra,`ss-action-button ${variant}`,ico);
}
function permissionCard(permission){
 if(!permission||['approved','active'].includes(permission.status))return '';
 const canceled=permission.status==='canceled',requested=permission.status==='requested';
 return `<section class="ss-permission-card" aria-label="权限中断"><span class="ss-permission-icon">${icon('shield')}</span><div class="ss-permission-copy"><strong>${canceled?'授权申请已取消':requested?'授权申请待审批':'需要来源访问权限'}</strong><p>${esc(permission.permissionName)}</p><small>仅申请完成当前子任务所需的最小访问范围</small></div><div class="ss-permission-action">${requested?conversationStatusBadge('waiting_approval'):conversationActionButton(canceled?'重新申请':'申请权限',canceled?'super-permission-reopen':'super-permission-apply',`data-id="${permission.id}"`,'primary')}</div></section>`;
}
function subtaskRow(st,run){
 return `<li id="${st.id}" class="ss-subtask ${st.status}"><button class="ss-subtask-main" data-action="super-task-source" data-id="${st.id}" data-query-id="${run.query.id}" title="查看该子任务的执行详情"><span class="ss-subtask-index">${st.index}</span><strong class="grow">${esc(st.name)}</strong>${conversationStatusBadge(st.status)}${icon('chevron')}</button>${run.permissions.filter(p=>p.relatedSubtaskIds.includes(st.id)).map(permissionCard).join('')}</li>`;
}
function lifecycleGate(q){
 if(q.status==='awaiting_scope'){const scope=q.scopeDetails||{};return `<form id="super-scope-form" class="ss-lifecycle-card"><header>${icon('search')}<div><strong>确认研判范围</strong><p>范围确认前不会开始执行子任务。</p></div></header><div class="ss-scope-grid"><label>研判对象<input name="subject" value="${esc(scope.subject||'')}" required></label><label>起始日期<input type="date" name="startDate" value="${esc(scope.startDate||'')}" required></label><label>结束日期<input type="date" name="endDate" value="${esc(scope.endDate||'')}" required></label></div><label class="ss-source-check"><input type="checkbox" name="includeRestricted" checked> 包含需要审批的受限来源</label><button class="btn ss-action-button primary" type="submit">确认范围并生成计划</button></form>`;}
 if(q.status==='awaiting_plan')return `<section class="ss-lifecycle-card" data-plan-version="${q.planVersion}"><header>${icon('folder-tree')}<div><strong>确认执行计划 · v${q.planVersion}</strong><p>${esc(q.scope)}</p></div></header><p>${q.replanReason?`重规划原因：${esc(q.replanReason)}。已完成步骤将标记为“已复用”。`:'计划确认前，所有子任务保持待执行。'}</p>${conversationActionButton('确认计划并执行','super-plan-confirm',`data-query-id="${q.id}"`,'primary')}</section>`;
 if(q.status==='waiting_approval'&&q.resumeAvailable)return `<section class="ss-lifecycle-card"><header>${icon('shield')}<div><strong>授权已激活</strong><p>审批和激活已完成，请确认从本轮暂停位置继续。</p></div></header>${conversationActionButton('继续本轮研判','super-resume-query',`data-query-id="${q.id}"`,'primary')}</section>`;
 return '';
}
function queryControls(q){
 if(q.historical)return '';
 if(['running','waiting_approval','pending'].includes(q.status))return `<div class="ss-query-controls">${conversationActionButton('重规划','super-query-replan',`data-query-id="${q.id}"`,'secondary')}${conversationActionButton('终止本轮','super-query-stop',`data-query-id="${q.id}"`,'danger')}</div>`;
 if(['done','failed','partial_success'].includes(q.status))return `<div class="ss-query-controls">${conversationActionButton('重规划','super-query-replan',`data-query-id="${q.id}"`,'secondary')}</div>`;
 if(q.status==='stopping')return `<div class="ss-query-controls">${conversationStatusBadge('running')}</div>`;
 return '';
}
function rotatedRecommendations(q,ss){
 const all=q.recommendedQueries||[],offset=Number(ss.ui.recommendationOffsets?.[q.id]||0);if(!all.length)return [];
 return all.map((_,index)=>all[(index+offset)%all.length]).slice(0,3);
}
function recommendationRefreshButton(q,count){
 return `<button type="button" class="btn ss-action-button ghost-accent ss-recommend-refresh" data-action="super-recommend-refresh" data-query-id="${q.id}" ${count<2?'disabled':''}><span class="ss-dify-icon ss-dify-icon-refresh" aria-hidden="true"></span>换一换</button>`;
}
function turnRecommendations(q,ss,enabled){
 const items=rotatedRecommendations(q,ss),count=(q.recommendedQueries||[]).length;if(!items.length)return '';
 return `<section class="ss-recommendations" aria-label="本轮推荐提问"><header><strong>推荐提问</strong>${recommendationRefreshButton(q,count)}</header><div class="ss-suggested-query-list">${items.map(text=>`<button class="ss-suggested-query" data-action="super-recommend" data-query="${esc(text)}" title="${esc(text)}" ${enabled?'':'disabled'}><span>${esc(text)}</span>${icon('arrow')}</button>`).join('')}</div></section>`;
}
function reportArtifact(a){
 return `<article class="ss-report-artifact"><span class="ss-report-icon">${icon('file')}</span><div class="grow"><strong>${esc(a.name)}</strong><small>${esc(a.type||'研判报告')} · ${esc(a.size||'合成示例')}</small></div>${conversationActionButton('查看报告','super-file-preview',`data-id="${a.id}"`,'secondary')}</article>`;
}
function conversationSectionLabel(label,asset){
 return `<span class="ss-task-section-label"><span class="ss-task-section-icon" aria-hidden="true"><img class="ss-task-section-icon-light" src="/assets/super-search/conversation/${asset}.svg" alt=""><img class="ss-task-section-icon-dark" src="/assets/super-search/conversation/${asset}-dark.svg" alt=""></span>${label}</span>`;
}
function resultFindings(q){
 if(q.findings)return q.findings;
 return String(q.finalConclusion||'').split(/[。；]/).map(item=>item.trim()).filter(Boolean).slice(1,4);
}
function resultSection(run,ss){
 const q=run.query,finals=(q.finalArtifacts||[]).map(id=>ss.artifacts.find(item=>item.id===id)).filter(Boolean),findings=resultFindings(q);
 return `<section class="ss-task-result">${conversationSectionLabel('结论输出','conclusion')}<h2>${q.status==='done'?'研判结论':'阶段性结果'}</h2><p class="ss-result-body">${esc(q.finalConclusion)}</p>${findings.length?`<div class="ss-key-findings"><strong>关键发现</strong><ul>${findings.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div>`:''}${q.historical?conversationActionButton(q.graphButtonLabel||'查看资金关系图','super-workspace-tab','data-tab="导图空间"','ghost'):""}${finals.length?`<div class="ss-report-artifacts">${finals.map(reportArtifact).join('')}</div>`:''}</section>`;
}
function taskRewrite(q){
 return `<section class="ss-task-rewrite">${conversationSectionLabel('意图识别','goal')}<h2>${esc(q.rewrittenTaskName)}</h2><p>计划 v${q.planVersion||1} · ${esc(q.scope||'范围待确认')}</p></section>`;
}
function taskProgress(q,complete,total,percent){
 return `<section class="ss-task-progress"><strong>${complete} / ${total} 子任务已完成</strong><div class="ss-task-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="${complete} / ${total} 子任务已完成"><i style="width:${percent}%"></i></div></section>`;
}
function historicalSummary(run,complete,total){
 const q=run.query,summary=conversationState(q.status)==='done'?`${complete} 个子任务全部完成`:taskStatusTitle(q.status,complete,total);
 return `<div class="ss-historical-summary"><header>${conversationStatusBadge(q.status)}<strong>${esc(summary)}</strong><time>${esc(q.createdAt)}</time></header><p><b>核心结论：</b>${esc(q.finalConclusion)}</p></div>`;
}
function taskDetailCard(run,ss,expanded,isLatest,complete,total,percent){
 const q=run.query,hasPendingApproval=q.status==='waiting_approval'||q.subtasks.some(task=>task.status==='waiting_approval');
 const footer=(!isLatest||hasPendingApproval)?`<footer class="ss-task-detail-footer">${conversationActionButton(expanded?'收起任务详情':'展开任务详情','super-turn-toggle',`data-id="${q.id}" aria-expanded="${expanded}"`,'ghost','chevron')}</footer>`:'';
 if(!expanded)return `<section class="ss-task-detail-card is-collapsed" aria-label="任务详情">${historicalSummary(run,complete,total)}${footer}</section>`;
 return `<section class="ss-task-detail-card is-expanded" aria-label="任务详情"><header class="ss-task-detail-header">${conversationStatusBadge(q.status)}<strong>${taskStatusTitle(q.status,complete,total)}</strong>${queryControls(q)}</header><div class="ss-task-divider"></div><div class="ss-task-detail-content">${taskRewrite(q)}${lifecycleGate(q)}${taskProgress(q,complete,total,percent)}<section class="ss-task-subtasks" aria-label="任务规划">${conversationSectionLabel('任务规划','task')}<ol class="ss-subtasks">${q.subtasks.map(st=>subtaskRow(st,run)).join('')}</ol></section><div class="ss-task-divider"></div>${resultSection(run,ss)}</div>${footer?`<div class="ss-task-divider"></div>${footer}`:''}</section>`;
}
function conversationTurn(run,ss,isLatest){
 const q=run.query,collapsedByDefault=['done','failed','terminated'].includes(q.status),manuallyExpanded=ss.ui.expandedTurns.includes(q.id),manuallyCollapsed=ss.ui.collapsedTurns.includes(q.id),expanded=!manuallyCollapsed&&(isLatest||manuallyExpanded||!collapsedByDefault),recommendEnabled=canStartSuperQuery();
 const complete=q.subtasks.filter(task=>['done','reused'].includes(task.status)).length,total=q.subtasks.length,percent=total?Math.round(complete/total*100):0;
 const attachments=(q.attachmentIds||[]).map(id=>ss.artifacts.find(file=>file.id===id)).filter(Boolean);
 return `<article class="ss-conversation-turn ${expanded?'is-expanded':'is-collapsed'} ${isLatest?'is-latest':''}" data-query-id="${q.id}"><div class="ss-query-message" title="${esc(q.createdAt)}"><div class="ss-query-stack">${attachments.map(a=>`<button class="ss-query-attachment" data-action="super-file-preview" data-id="${a.id}" title="${esc(a.name)}">${fileIcon(a.type)}<span>${esc(a.name)}</span></button>`).join('')}<div class="ss-query-text"><strong>${esc(q.originalQuery)}</strong></div></div></div>${taskDetailCard(run,ss,expanded,isLatest,complete,total,percent)}${turnRecommendations(q,ss,recommendEnabled)}</article>`;
}
function centerTask(ss,session){
 const latest=ss.queries.at(-1),composerReady=canStartSuperQuery(latest?.query)&&!!ss.draft?.trim();
 return `<section class="search-center ss-center" aria-label="超级搜索对话">${paneControls()}<div class="messages ss-messages" id="messages"><div class="ss-conversation-stream">${ss.queries.map((run,index)=>conversationTurn(run,ss,index===ss.queries.length-1)).join('')}</div></div><button class="ss-latest-button ${ss.ui.followLatest&&!ss.ui.hasNewProgress?'is-hidden':''}" data-action="super-scroll-latest">${ss.ui.hasNewProgress?'有新的执行进展':'返回最新进展'}</button><div class="ss-composer-dock">${renderQueryComposer({context:'history',formId:'super-search-composer',textareaId:'super-search-prompt',value:ss.draft||'',placeholder:'继续追问、补充线索或发起新的研判任务…',disabled:!canStartSuperQuery(latest?.query),sendDisabled:!composerReady,ss})}</div></section>`;
}
function renderNewTaskCenter(){
 const starters=[
  ['资金分析','资金流','fund-analysis','查一下张三 220221194509013544 最近30天的交易情况'],
  ['人员分析','人员流','person-analysis','核查演示对象甲近30天轨迹，并分析时空冲突'],
  ['警情问答','警情问答','alert-qa','统计演示辖区近30天各类别警情数量'],
  ['网络分析','网络分析','network-analysis','分析演示对象的关联人员、账户与活动网络']
 ];
 const draft=state.newDraft||'';
 return `<section class="search-center ss-center ss-new-task" aria-label="新建超级搜索任务">${paneControls()}<div class="ss-new-task-content"><div class="ss-new-task-welcome"><div class="ss-new-task-mark"><img class="brand-mark" src="/assets/brand/logo.svg" alt=""></div><p class="ss-new-task-kicker">超级搜索 · 新任务</p><h1>全警智搜，精准研判</h1><p class="ss-new-task-lead">作为AI支持的警务对话引擎，我可以回答您的问题，为您提供有用的线索信息，辅助您的日常警务工作</p><div class="ss-new-task-starters">${starters.map(([label,type,asset,question])=>`<button class="ss-new-task-starter" data-action="starter" data-type="${type}" data-question="${esc(question)}"><span class="ss-starter-icon"><img class="ss-starter-icon-light" src="/assets/super-search/${asset}.svg" alt=""><img class="ss-starter-icon-dark" src="/assets/super-search/${asset}-dark.svg" alt=""></span><span><strong>${label}</strong><small>${esc(question)}</small></span>${icon('arrow')}</button>`).join('')}</div></div></div><div class="ss-composer-dock ss-new-task-composer">${renderQueryComposer({context:'new',formId:'composer-form',textareaId:'prompt',value:draft,placeholder:'输入搜索问题，或补充检索条件',sendDisabled:!draft.trim()})}</div></section>`;
}
function emptyWorkspaceTab(tab){
 const copy={
  '工作空间':['folder','任务尚未开始','发送问题并确认范围后，这里会展示执行计划、Agent 与工具运行记录。'],
  '文档空间':['file','暂无任务文档','上传的材料、过程文件与最终研判产物会集中保存在这里。'],
  '导图空间':['graph','暂无实体关系','识别到实体与关系后，这里会生成可追溯的线索图谱。']
 }[tab]||['folder','任务尚未开始','发送问题后，研判空间会随执行过程同步更新。'];
 return `<div class="ss-empty-workspace"><span>${workspaceIcon(copy[0])}</span><strong>${copy[1]}</strong><p>${copy[2]}</p><small>新任务不会读取当前历史会话的执行数据</small></div>`;
}

function permissionBatch(ss){
 const pending=ss.permissions.filter(p=>['pending','requested'].includes(p.status));if(!pending.length)return '';
 const selectable=pending.filter(p=>p.status!=='requested'),selected=selectable.filter(p=>ss.ui.selectedPermissions.includes(p.id)).length;
 return `<section class="ss-permission-batch"><div class="ss-permission-summary"><button data-action="super-permission-toggle" aria-expanded="${ss.ui.permissionExpanded}" class="ss-permission-heading">${icon('shield')}<strong>权限申请 <span>${pending.length}</span></strong>${icon('down')}</button><div class="actions">${btn('批量申请','super-permission-apply',`data-id="all" ${selected?'':'disabled'}`,'ghost small ss-text-action')}${btn('取消','super-permission-cancel',`data-id="all" ${selected?'':'disabled'}`,'ghost small')}</div></div>${ss.ui.permissionExpanded?`<div class="ss-permission-list">${pending.map(p=>`<label><input type="checkbox" data-super-permission="${p.id}" ${ss.ui.selectedPermissions.includes(p.id)?'checked':''} ${p.status==='requested'?'disabled':''}><span><strong>${esc(p.permissionCode)}</strong><small>${esc(p.permissionName)}</small><small>${p.relatedToolCallIds.map(id=>{const t=getSuperSearchTool(id),st=ss.query.subtasks.find(s=>s.id===t?.subtaskId);return esc(`${st?.index||'—'} / ${t?.toolId||id}`);}).join(' · ')}</small></span></label>`).join('')}</div>`:''}</section>`;
}
function highlightedCode(code){
 const pattern=/(#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:from|import|for|in|return|def|if|True|False|None|SELECT|FROM|WHERE)\b|\b\d+\b)/g;
 return code.split('\n').map((line,i)=>{let cursor=0,out='';for(const match of line.matchAll(pattern)){out+=esc(line.slice(cursor,match.index));const token=match[0],cls=token[0]==='#'?'comment':/^['"]/.test(token)?'string':/^\d/.test(token)?'number':'keyword';out+=`<span class="ss-syntax-${cls}">${esc(token)}</span>`;cursor=match.index+token.length;}out+=esc(line.slice(cursor));return `<div><span class="ss-line-number">${i+1}</span><code>${out||' '}</code></div>`;}).join('');
}
function toolDetails(ss,tool){
 const files=tool.artifacts.map(id=>getSuperSearchArtifact(id)).filter(Boolean);
 const historical=ss.query.historical,active=ss.ui.actionTabs?.[tool.id]||'执行信息',tabs=['执行信息',...(tool.code?['运行代码']:[]),'输出结果','技术详情'];
 const hidden=name=>historical&&active!==name?' hidden':'';
 return `<div class="ss-tool-detail"><div class="ss-trace-context">${esc(tool.queryId)} / 子任务 ${esc(ss.query.subtasks.find(s=>s.id===tool.subtaskId)?.index||tool.subtaskId)} · 本地执行记录</div>
 ${historical?`<div class="ss-action-tabs" role="tablist" aria-label="Action 详情">${tabs.map(name=>`<button role="tab" aria-selected="${active===name}" data-action="super-action-tab" data-id="${tool.id}" data-tab="${name}">${name}</button>`).join('')}</div>`:''}<section${hidden('执行信息')}><h4>执行信息</h4><dl class="ss-params">${Object.entries(tool.params||{}).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(Array.isArray(v)?v.join('、'):v)}</dd></div>`).join('')}</dl></section>
 <section${hidden(tool.code?'运行代码':'执行信息')}><h4>${tool.code?'运行代码':'执行轨迹'} ${tool.code?`<span>${esc(tool.codeType||'Python')}</span>`:''}</h4>${tool.code?`<div class="ss-code-panel" tabindex="0" aria-label="带行号的执行代码">${highlightedCode(tool.code)}</div>`:`<ol class="ss-trace-list">${tool.trace.length?tool.trace.map((step,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(step)}</li>`).join(''):'<li>工具尚未开始执行。</li>'}</ol>`}</section>
 <section${hidden('输出结果')}><h4>输出结果</h4><div class="ss-result-summary">${statusMark(tool.status)}<p>${esc(tool.resultSummary)}</p></div></section>
 <section${hidden('输出结果')}><h4>产出文件 <span>${files.length}</span></h4>${files.length?files.map(a=>`<div class="ss-tool-artifact">${icon('file')}<button class="ss-artifact-name" title="${esc(a.name)}" data-action="super-file-preview" data-id="${a.id}">${esc(a.name)}</button>${btn(icon('folder'),'super-artifact-focus',`data-id="${a.id}" aria-label="定位到文档空间" title="定位到文档空间"`,'ghost icon-only')}${btn(icon('download'),'super-file-download',`data-id="${a.id}" aria-label="下载 ${esc(a.name)}"`,'ghost icon-only')}</div>`).join(''):'<p class="small muted">此步骤尚未产生文件。</p>'}</section>
 ${tool.technical?`<section${hidden('技术详情')}><h4>技术详情 · 默认脱敏</h4><pre class="ss-preview-content">${esc(JSON.stringify({...tool.technical,started_at:tool.startedAt,completed_at:tool.completedAt,dynamic:tool.dynamic||false,generated_by:tool.generatedBy||null},null,2))}</pre></section>`:''}${tool.error?`<details class="ss-tech-error" ${tool.status==='failed'?'open':''}><summary>技术详情 · ${esc(tool.error.code)}</summary><p>${esc(tool.error.message)}</p>${tool.permissionRequestId?`<code>${esc(ss.permissions.find(p=>p.id===tool.permissionRequestId)?.permissionCode)}</code>`:''}</details>`:''}
 ${tool.status==='running'?btn('暂停执行','super-tool-control',`data-id="${tool.id}" data-control="pause"`,'small','pause'):['paused','failed'].includes(tool.status)?btn(tool.status==='failed'?'重试工具':'恢复执行','super-tool-control',`data-id="${tool.id}" data-control="resume"`,'small','play'):''}</div>`;
}
function toolRow(ss,t,index){const expanded=ss.ui.expandedTools.includes(t.id);return `<div class="ss-tool ${t.status} ${expanded?'is-open':''} ${ss.ui.highlightTool===t.id?'is-highlighted':''}" data-tool-id="${t.id}"><button class="ss-tool-row" data-action="super-tool-toggle" data-id="${t.id}" aria-expanded="${expanded}" title="${esc(t.toolId+' · '+t.toolName+' · '+statusText(t.status))}">${statusMark(t.status)}<span class="ss-tool-copy"><span class="ss-tool-name">${esc(t.toolId)} · ${esc(t.toolName)}</span></span><span class="ss-tool-meta">${['done','failed'].includes(t.status)?esc(t.duration):statusText(t.status)}</span>${icon('down')}</button>${expanded?toolDetails(ss,t):''}</div>`;}
function agentCard(ss,agent){
 const expanded=ss.ui.expandedAgents.includes(agent.id),analysis=agent.id==='data-analysis-agent',asset=analysis?'analysis-agent':'information-agent';
 return `<article class="ss-agent-card ${expanded?'is-open':''}"><button class="ss-agent-header" data-action="super-agent-toggle" data-id="${agent.id}" aria-expanded="${expanded}"><span class="ss-agent-art"><img class="ss-agent-light" src="/assets/super-search/${asset}.svg" alt="" width="28" height="28"><img class="ss-agent-dark" src="/assets/super-search/${asset}-dark.svg" alt="" width="28" height="28"></span><span class="grow"><strong>${esc(agent.name)}</strong></span>${icon('down')}</button>${expanded?`<p class="ss-agent-summary">${esc(agent.description||(analysis?'数据清洗 · 统计分析 · 线索关联':'身份核验 · 流水获取 · 账号查询'))}</p><div class="ss-agent-body">${agent.toolCalls.length?agent.toolCalls.map((t,i)=>toolRow(ss,t,i)).join(''):'<p class="ss-empty">暂无分配任务</p>'}</div>`:''}</article>`;
}
function workspaceTab(ss){return `${permissionBatch(ss)}<div class="ss-agent-stack">${ss.agents.map(a=>agentCard(ss,a)).join('')}</div>`;}
const FILE_ICON_GROUPS={excel:['XLS','XLSX','CSV'],pdf:['PDF'],apk:['APK'],zip:['ZIP','RAR','7Z'],image:['PNG','JPG','JPEG','WEBP','GIF','SVG'],video:['MP4','MOV','AVI','MKV','WEBM'],text:['TXT','MD','JSON','DOC','DOCX','PPT','PPTX']};
function fileIcon(type){
 const normalized=String(type||'TXT').trim().replace(/^\./,'').toUpperCase();
 const kind=Object.entries(FILE_ICON_GROUPS).find(([,types])=>types.includes(normalized))?.[0]||'text';
 return `<img class="ss-file-type" data-file-type="${esc(normalized)}" data-icon-kind="${kind}" src="/assets/super-search/file-icons/${kind}.svg" alt="${esc(normalized)} 文件图标" width="28" height="28">`;
}

function artifactRow(a){const fund=a.id.startsWith('ART-METRIC');return `<div class="ss-artifact-row ${a.id===ensureSuperSearchState().ui.highlightArtifact?'is-highlighted':''}" data-artifact-id="${a.id}">${fileIcon(a.type)}<button class="ss-artifact-name" data-action="super-file-preview" data-id="${a.id}" title="${esc(a.name)}">${esc(a.name)}</button><span class="ss-file-size">${esc(a.size)}</span>${fund?btn('资金分析','super-open-fund-analysis',`data-id="${a.id}" data-query-id="${a.queryId}"`,'small'):''}<div class="ss-file-actions">${btn(superIcon('eye'),'super-file-preview',`data-id="${a.id}" aria-label="预览 ${esc(a.name)}"`,'ghost icon-only')}${a.toolCallId?btn(superIcon('source'),'super-file-locate',`data-id="${a.id}" aria-label="定位 ${esc(a.name)} 的来源"`,'ghost icon-only'):''}${btn(icon('download'),'super-file-download',`data-id="${a.id}" aria-label="下载 ${esc(a.name)}"`,'ghost icon-only')}</div></div>`;}
function folder(ss,id,title,files,meta,options={}){const expanded=ss.ui.expandedFolders.includes(id),nested=options.nested!==false&&files.some(a=>(a.folderPath||[]).length>1);let content='';if(expanded){if(nested){const direct=files.filter(a=>(a.folderPath||[]).length<2),groups=[...new Set(files.map(a=>a.folderPath?.[1]).filter(Boolean))];content=`<div class="ss-folder-files">${direct.map(artifactRow).join('')}${groups.map(name=>folder(ss,`${id}/${name}`,name,files.filter(a=>a.folderPath?.[1]===name),`${files.filter(a=>a.folderPath?.[1]===name).length} 个文件`,{nested:false,child:true})).join('')}</div>`;}else content=`<div class="ss-folder-files">${files.length?files.map(artifactRow).join(''):'<p class="ss-empty">本轮查询尚未产生文件。</p>'}</div>`;}return `<section class="ss-file-folder ${options.child?'ss-file-folder-child':''}"><div class="ss-folder-row"><button class="ss-folder-toggle" data-action="super-folder-toggle" data-id="${id}" aria-expanded="${expanded}" title="${esc(title+' · '+meta)}">${icon('down')}<span class="ss-folder-icon" aria-hidden="true"><img class="ss-folder-light" src="/assets/super-search/file-icons/folder.svg" alt="" width="24" height="24"><img class="ss-folder-dark" src="/assets/super-search/file-icons/folder-dark.svg" alt="" width="24" height="24"></span><strong class="grow">${esc(title)}</strong><span class="ss-folder-count">${files.length}</span></button>${id==='UPLOAD'?btn(icon('plus'),'super-upload','aria-label="添加上传文件" title="添加文件"','ghost icon-only'):''}</div>${content}</section>`;}
function documentTab(ss){
 const uploads=ss.artifacts.filter(a=>a.sourceType==='user_upload');
 const taskFolders=ss.queries.map((run,i)=>folder(ss,run.query.id,run.query.rewrittenTaskName,ss.artifacts.filter(a=>a.queryId===run.query.id&&a.sourceType!=='user_upload'),`任务 ${i+1} · ${statusText(run.query.status)}`,isRichHistory(ss)?{nested:false}:{})).join('');
 return `<div class="ss-file-tree ${isRichHistory(ss)?'ss-history-file-tree':''}">${folder(ss,'UPLOAD','用户上传的文件',uploads,'原始材料',ss.fixture==='person-v1'?{nested:false}:{})}${taskFolders}</div>`;
}
function graphNodes(ss){return ss.entities.map((e,i)=>({...e,x:e.x??(i%2?324:22),y:e.y??(42+Math.floor(i/2)*185)}));}
function entityDetails(ss){
 const relation=ss.relations.find(r=>r.id===ss.graph.selectedRelation);
 if(relation)return relationDetails(ss,relation);
 const e=ss.entities.find(e=>e.id===ss.graph.selected)||ss.entities[0];if(!e)return '';
 const relations=ss.relations.filter(r=>r.from===e.id||r.to===e.id);
 return `<aside class="ss-entity-detail"><header><span class="ss-agent-icon">${difyEntityIcon(e.icon||'person')}</span><div class="grow"><strong>${esc(e.name)}</strong><p>${esc(e.type)} · ${isRichHistory(ss)?'模拟线索 · 待实证核验':e.state==='Success'?'示例已核验':'待核验'}</p></div>${tag(isRichHistory(ss)?'模拟':e.state==='Success'?'已核验':'待核验',isRichHistory(ss)?'neutral':e.state==='Success'?'success':'warning')}</header>${['network-v1','person-v1'].includes(ss.fixture)&&e.summary?`<p class="ss-entity-summary">${esc(e.summary)}</p>`:''}${isRichHistory(ss)?`<div class="actions">${btn('查看档案','super-entity-profile',`data-id="${e.id}"`,'small')}${btn('查看证据','super-graph-evidence',`data-id="${e.id}"`,'small')}${btn('在对话中追问','super-graph-context',`data-id="${e.id}"`,'small')}</div>`:''}<section><h4>基础属性</h4><dl>${Object.entries(e.properties).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section><section><h4>关联关系</h4>${relations.map(r=>`<p><span>${esc(r.type)} ${r.from===e.id?'→':'←'}</span>${esc(ss.entities.find(x=>x.id===(r.from===e.id?r.to:r.from))?.name||'未知实体')}</p>`).join('')||'<p>暂无关联关系</p>'}</section><section><h4>线索来源 <span>${e.sourceRefs.length}</span></h4>${e.sourceRefs.map(ref=>{const t=getSuperSearchTool(ref.toolCallId),a=getSuperSearchArtifact(ref.artifactId);return `<button data-action="super-entity-source" data-tool-id="${esc(ref.toolCallId||'')}" data-artifact-id="${esc(ref.artifactId||'')}"><strong>${esc(ref.queryId||t?.queryId||'用户输入')} → ${esc(ref.subtaskId||t?.subtaskId||'—')}</strong><span>${esc(t?.agentId==='data-analysis-agent'?'数据分析 Agent':'信息获取 Agent')} → ${esc(t?.toolId||'原始输入')}</span><small>${esc(a?.name||'无来源文件')}</small></button>`;}).join('')}</section></aside>`;
}
function relationDetails(ss,r){
 const from=ss.entities.find(e=>e.id===r.from),to=ss.entities.find(e=>e.id===r.to),props=Object.keys(r.properties||{}).length?r.properties:{金额:r.label,时间:r.time||'—',交易流水号:r.transactionId||'原附件未提供'},refs=r.sourceRefs||[];
 return `<aside class="ss-entity-detail"><header><strong>${esc(from?.name)} → ${esc(to?.name)}</strong></header><section><h4>${esc(r.type)}</h4><dl>${Object.entries(props).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section><section><h4>证据文件（选择后定位）</h4>${refs.map(ref=>{const a=getSuperSearchArtifact(ref.artifactId);return a?`<button data-action="super-file-preview" data-id="${a.id}">${esc(a.name)}</button>`:'';}).join('')||'<p>暂无证据文件</p>'}</section><div class="actions">${btn('查看证据','super-graph-evidence',`data-id="${r.id}"`,'small')}${btn('在对话中追问','super-graph-context',`data-id="${r.id}"`,'small')}</div></aside>`;
}
function interactiveGraph(nodes,links,options,ss){
 let html=entityGraph(nodes,links,options);
 if(!isRichHistory(ss))return html;
 html=html.replace('class="entity-graph ', `class="entity-graph ss-rich-graph ${ss.fixture==='fund-v2'?'ss-fund-graph':ss.fixture==='person-v1'?'ss-person-graph':'ss-network-graph'} `);
 let index=0;
 html=html.replace(/<path d="([^"]+)" class="([^"]*)"\/>/g,(match,path,classes)=>{
  const edge=links[index++];return `${match}<path d="${path}" class="ss-edge-hit" data-action="super-relation-detail" data-id="${edge.id}"/>`;
 });
 // Keyboard-accessible edge controls supplement the SVG hit targets.
 return html+`<div class="ss-relation-list" aria-label="${esc(ss.graph.relationListLabel||'实体关系')}">${links.filter(r=>['network-v1','person-v1'].includes(ss.fixture)||r.amountCents).map(r=>`<button class="btn small" data-action="super-relation-detail" data-id="${r.id}">${esc(ss.entities.find(e=>e.id===r.from)?.title||ss.entities.find(e=>e.id===r.from)?.name)} → ${esc(ss.entities.find(e=>e.id===r.to)?.title||ss.entities.find(e=>e.id===r.to)?.name)} · ${esc(r.label||r.type)}</button>`).join('')}</div>`;
}
function graphTab(ss){
 const nodes=graphNodes(ss),positions=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const links=ss.relations.map((r,i)=>{const a=positions[r.from],b=positions[r.to];if(!a||!b)return r;const parallel=isRichHistory(ss)&&ss.relations.filter(e=>e.from===r.from&&e.to===r.to).length>1,offset=parallel?(r.id.endsWith('001')?-24:24):0;const same=a.x===b.x,x=a.x+(same?121:242),y=a.y+(same?126:25),tx=b.x+(same?121:0),ty=b.y;return {...r,label:r.label||r.type,path:same?`M ${x} ${y} C ${x} ${y+30}, ${tx} ${ty-30}, ${tx} ${ty}`:parallel?`M ${a.x+242} ${a.y+25+offset} C ${(a.x+242+b.x)/2} ${a.y+25+offset}, ${(a.x+242+b.x)/2} ${b.y+25+offset}, ${b.x} ${b.y+25+offset}`:undefined,labelX:same?x+18:((a.x+242)+b.x)/2,labelY:same?(y+ty)/2:Math.min(a.y,b.y)+10+offset};});
 return `<div class="ss-graph-head"><div><strong>实体线索图谱</strong></div>${tag(`${nodes.length} 实体 · ${links.length} 关系`)}</div>${nodes.length?`<div class="ss-graph-layout"><div class="ss-graph-canvas">${interactiveGraph(nodes,links,{id:'superSearch',width:ss.graph.width||590,height:ss.graph.height||Math.max(410,Math.ceil(nodes.length/2)*185+40),ui:ss.graph,detailAction:'super-entity-detail',iconRenderer:difyEntityIcon},ss)}<div class="ss-graph-controls">${btn('−','node-zoom','data-graph-id="superSearch" data-delta="-.15" aria-label="缩小导图"','small')}${btn('适应','node-fit','data-graph-id="superSearch"','small')}${btn('+','node-zoom','data-graph-id="superSearch" data-delta=".15" aria-label="放大导图"','small')}</div><div class="ss-graph-legend"><span><i></i>来源事实</span><span><i class="inferred"></i>待核验</span></div></div>${entityDetails(ss)}</div>`:'<div class="ss-empty">尚未发现实体线索。工具返回结果后将在此更新。</div>'}`;
}
export function renderSuperSearchWorkspace(tab,options={}){const empty=!!options.empty,layout=ensureSuperSearchLayout(),ss=empty?null:ensureSuperSearchState(),embedded=!!options.embedded,expanded=options.expanded!==false,activeTab=empty?(tab||options.activeTab||layout.newTaskTab||'工作空间'):ss.activeTab;if(tab&&!empty)ss.activeTab=tab;const content=empty?emptyWorkspaceTab(activeTab):activeTab==='工作空间'?workspaceTab(ss):activeTab==='文档空间'?documentTab(ss):graphTab(ss);return `<aside class="right-panel ss-workspace ${embedded?'ss-workspace-card':''} ${empty?'ss-workspace-empty':''}" ${embedded&&!expanded?'inert aria-hidden="true"':''} data-empty="${empty}"><div class="ss-workspace-chrome"><div class="ss-workspace-title"><strong>研判空间</strong>${btn(superIcon('panel'),'super-pane-collapse','data-pane="right" aria-label="收起研判空间" title="收起研判空间"','ghost icon-only')}</div><div class="tabs" role="tablist" aria-label="研判空间标签">${['工作空间','文档空间','导图空间'].map((name,i)=>`<button id="ss-tab-${i}" role="tab" aria-controls="ss-panel" aria-selected="${name===activeTab}" tabindex="${name===activeTab?0:-1}" class="${name===activeTab?'active':''}" data-action="super-workspace-tab" data-tab="${name}">${workspaceIcon(i===0?'folder':i===1?'file':'graph')}<span>${name}</span></button>`).join('')}</div></div><div id="ss-panel" class="right-content ss-right-content" role="tabpanel" aria-labelledby="ss-tab-${['工作空间','文档空间','导图空间'].indexOf(activeTab)}">${content}</div></aside>`;}
function renderWorkspaceRail(ss,layout,options={}){const expanded=options.expanded??layout.workspaceExpanded;return `<section class="ss-workspace-rail" aria-label="研判空间容器">${isRichHistory(ss)?'<div class="ss-workspace-resizer" role="separator" tabindex="0" aria-orientation="vertical" aria-label="调整研判空间宽度"></div>':''}${renderSuperSearchWorkspace(undefined,{embedded:true,expanded,empty:options.empty,activeTab:layout.newTaskTab})}${workspaceLauncher(ss,expanded)}</section>`;}
export function renderSuperSearchNewTask(){const layout=ensureSuperSearchLayout(),expanded=layout.newTaskWorkspaceExpanded;return `<main id="main" class="workbench super-search-page ss-new-task-page ${layout.leftCollapsed?'ss-left-collapsed':''} ${expanded?'':'ss-right-collapsed'}" data-new-task="true">${renderSuperSearchSidebar({newTask:true})}${renderNewTaskCenter()}${renderWorkspaceRail(null,layout,{empty:true,expanded})}</main>`;}
export function renderSuperSearch(){const ss=ensureSuperSearchState(),layout=ensureSuperSearchLayout();return `<main id="main" class="workbench super-search-page ${layout.leftCollapsed?'ss-left-collapsed':''} ${layout.workspaceExpanded?'':'ss-right-collapsed'} ${isRichHistory(ss)?`ss-rich-history ${ss.fixture==='fund-v2'?'ss-fund-history':ss.fixture==='person-v1'?'ss-person-history':'ss-network-history'}`:''}" ${Number.isFinite(ss.ui.workspaceWidth)?`style="--ss-fund-width:${ss.ui.workspaceWidth}px"`:''}>${renderSuperSearchSidebar()}${centerTask(ss,current())}${renderWorkspaceRail(ss,layout)}</main>`;}
export function toggleSuperSearchList(list,id){const index=list.indexOf(id);if(index>=0)list.splice(index,1);else list.push(id);}
