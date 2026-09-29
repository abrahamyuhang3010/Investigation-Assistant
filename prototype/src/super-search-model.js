import {state,current,uid} from './state.js';
import {createDemoSeed} from './super-search-data.js';

const SCHEMA_VERSION=5;
const INFO='information-retrieval-agent', ANALYSIS='data-analysis-agent';
const TERMINAL_QUERY_STATUSES=new Set(['done','failed','terminated','partial_success']);
const dependencies={
 'TOOL-PROFILE':[], 'TOOL-BANK':['TOOL-PROFILE'], 'TOOL-FLOW':['TOOL-BANK'],
 'TOOL-NET':['TOOL-PROFILE'], 'TOOL-PARSE':['TOOL-FLOW'], 'TOOL-NORM':['TOOL-PARSE'],
 'TOOL-METRIC':['TOOL-NORM','TOOL-NET'], 'TOOL-LINK':['TOOL-METRIC'], 'TOOL-REPORT':['TOOL-LINK']
};
const generated={
 'TOOL-NET':{id:'ART-NET',name:'第三方账号主体信息.xlsx',preview:'账号：wx_demo_zhangsan\n实名主体：张三（合成）',type:'XLSX',size:'9.8 KB'},
 'TOOL-METRIC':{id:'ART-METRIC',name:'收支统计.xlsx',preview:'流入：286400\n流出：249800\n净流入：36600',type:'XLSX',size:'24.6 KB'},
 'TOOL-LINK':{id:'ART-RISK',name:'可疑交易列表.xlsx',preview:'6 笔待核验高频交易，仅为规则命中，不构成违法认定。',type:'XLSX',size:'18.2 KB'}
};

export const allQueryRuns=(ss=ensureSuperSearchState())=>ss.queries;
const toolsOf=run=>run.agents.flatMap(agent=>agent.toolCalls);
const latestRun=ss=>ss.queries.at(-1);
const activeRun=ss=>ss.queries.find(run=>run.query.id===ss.activeQueryId)||latestRun(ss)||ss.queries[0];
const runForPermission=(ss,id)=>id==='all'?activeRun(ss):ss.queries.find(run=>run.permissions.some(permission=>permission.id===id));
const timestamp=()=>new Date().toLocaleString('zh-CN',{hour12:false});
const scopeLabel=scope=>`${scope.subject||'待确认对象'} · ${scope.startDate||'起始日'} 至 ${scope.endDate||'结束日'} · ${(scope.sources||[]).join('、')||'待确认来源'}`;

function emitQueryEvent(run,type,payload={},eventKey){
 const query=run.query;
 query.processedEventIds ||= [];
 query.events ||= [];
 const stable=eventKey||`${type}:${payload.toolCallId||payload.permissionId||payload.planVersion||query.status}:${payload.status||''}`;
 if(query.processedEventIds.includes(stable))return false;
 query.processedEventIds.push(stable);
 query.eventSeq=(query.eventSeq||0)+1;
 query.events.push({id:`${query.id}-EV-${String(query.eventSeq).padStart(3,'0')}`,seq:query.eventSeq,type,at:Date.now(),...payload});
 return true;
}

function classifyQuery(text=''){
 return /轨迹|人员流|时空|位置|活动/.test(text)?'person':'fund';
}

function applyQueryTemplate(run,text){
 const kind=classifyQuery(text),subject=(text.match(/[\u4e00-\u9fa5]{2,4}(?=的|近|\s|$)/)||[])[0]||(/张三/.test(text)?'张三':'目标对象');
 run.query.kind=kind;
 run.query.scopeDetails={subject,startDate:'2026-08-30',endDate:'2026-09-28',sources:kind==='person'?['基础档案','轨迹记录','关联场所']:['基础档案','银行流水','第三方支付']};
 run.query.scope=scopeLabel(run.query.scopeDetails);
 if(kind==='person'){
  const names=['确认目标对象与稳定身份标识','采集授权范围内的活动轨迹','比对时空冲突与关联场所','分析高频地点和同行线索','汇总待核验线索并生成报告'];
  run.query.rewrittenTaskName=`围绕「${text}」开展人员轨迹与时空关联研判`;
  run.query.subtasks.forEach((task,index)=>task.name=names[index]);
  const toolNames=['身份稳定标识核验','授权轨迹记录查询','活动记录拉取','关联场所补充查询','轨迹文件解析','时空字段标准化','时空冲突统计','同行与场所关联分析','人员流研判报告生成'];
  toolsOf(run).forEach((tool,index)=>tool.toolName=toolNames[index]);
 }else{
  run.query.rewrittenTaskName=`围绕「${text}」开展账户、流水与资金关联研判`;
 }
 run.query.scopeDetails.subject=subject;
 run.query.scope=scopeLabel(run.query.scopeDetails);
}

function prepareRun(seed,number=1,originalQuery){
 const suffix=number===1?'':`-Q${number}`;
 const ids=new Set([
  ...seed.query.subtasks.map(s=>s.id),
  ...seed.agents.flatMap(a=>a.toolCalls.map(t=>t.id)),
  ...seed.permissions.map(p=>p.id),
  ...seed.artifacts.filter(a=>a.queryId).map(a=>a.id),
  ...Object.values(generated).map(a=>a.id)
 ]);
 const convert=value=>typeof value==='string'
  ?(ids.has(value)?value+suffix:value==='QUERY-01'?`QUERY-${String(number).padStart(2,'0')}`:value)
  :Array.isArray(value)?value.map(convert)
  :value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,convert(item)])):value;
 const run=convert({query:seed.query,agents:seed.agents,permissions:seed.permissions});
 run.query.createdAt=timestamp();
 run.query.planVersion=1;
 run.query.previousPlans=[];
 run.query.eventSeq=0;
 run.query.events=[];
 run.query.processedEventIds=[];
 run.query.scopeConfirmedAt=null;
 run.query.planConfirmedAt=null;
 run.query.stopRequestedAt=null;
 run.query.terminatedAt=null;
 if(originalQuery){run.query.originalQuery=originalQuery;applyQueryTemplate(run,originalQuery);}
 run.outputs=convert(seed.artifacts.filter(a=>a.queryId));
 const report=run.outputs.find(a=>a.id==='ART-REPORT'+suffix);if(report)report.pending=false;
 run.outputs.push(...Object.entries(generated).map(([base,artifact])=>({...convert(artifact),sourceType:base==='TOOL-NET'?'tool_output':'analysis_output',queryId:run.query.id,toolCallId:base+suffix,agentId:base==='TOOL-NET'?INFO:ANALYSIS,subtaskId:(base==='TOOL-NET'?'ST-03':'ST-04')+suffix})));
 for(const agent of run.agents)for(const tool of agent.toolCalls){
  tool.baseId=tool.id.replace(/-Q\d+$/,'');tool.agentId=agent.id;tool.queryId=run.query.id;
  tool.dependencies=(dependencies[tool.baseId]||[]).map(id=>id+suffix);
  tool.outputIds=run.outputs.filter(a=>a.toolCallId===tool.id).map(a=>a.id);
  tool.simulatedDuration=tool.duration==='—'?'8s':tool.duration;
  tool.planVersion=1;tool.attempt=1;
 }
 run.query.subtasks.forEach(task=>task.planVersion=1);
 run.graphSeed=convert({entities:seed.entities,relations:seed.relations});
 return run;
}

function finishDemoRun(run,{query,rewritten,createdAt,conclusion,recommendedQueries}){
 run.query.originalQuery=query;run.query.rewrittenTaskName=rewritten;run.query.createdAt=createdAt;run.query.status='done';run.query.finalConclusion=conclusion;run.query.recommendedQueries=recommendedQueries;
 run.query.scope='张三 · 最近30天 · 身份档案、银行流水、第三方支付';run.query.scopeDetails={subject:'张三',startDate:'2026-08-31',endDate:'2026-09-29',sources:['身份档案','银行流水','第三方支付']};
 run.query.subtasks.forEach(task=>task.status='done');toolsOf(run).forEach(tool=>{tool.status='done';delete tool.dueAt;delete tool.error;});run.permissions.forEach(permission=>permission.status='active');
 run.query.completedLeafTasks=run.query.subtasks.length;run.query.totalLeafTasks=run.query.subtasks.length;run.query.progressCompletedAt=Date.now()-60000;
}
function createDemoConversation(seed){
 const specs=[
  {query:'查一下张三 220221194509013544 最近30天的交易情况',rewritten:'围绕「张三最近30天交易情况」开展账户、流水与资金关联研判',createdAt:'2026-09-29 14:12',conclusion:'已完成最近30天交易流水核验，共纳入 2,341 条记录。账户流入 ¥286,400、流出 ¥249,800，发现 6 笔高频往来需要结合交易背景进一步核验。',recommendedQueries:['继续分析交易对手的多跳资金路径','核验高频夜间交易的对手方身份','按月对比张三账户的收支变化']},
  {query:'继续分析交易对手的多跳资金路径',rewritten:'围绕高频交易对手开展两跳资金路径与回流关系研判',createdAt:'2026-09-29 14:31',conclusion:'已完成两跳资金路径分析，识别出 1 条由张三账户经高频交易对手流向二跳账户的连续路径。该路径具有短时转出特征，仍需核验对应交易事由。',recommendedQueries:['重点核验第二个高频交易对手的身份','查看该人员关联支付宝账户的资金流水','按金额区间筛选多跳交易']},
  {query:'重点核验第二个高频交易对手的身份',rewritten:'围绕第二个高频交易对手开展主体身份、账户归属与关联关系核验',createdAt:'2026-09-29 14:46',conclusion:'已完成第二个高频交易对手的主体核验。现有资料显示其开户信息与交易留存身份一致，并与张三存在持续高频往来；尚无资料能够直接说明具体资金用途。',recommendedQueries:['查看该人员关联支付宝账户的资金流水','对比两个高频交易对手的收支节奏','补充核验交易备注与业务背景']}
 ];
 const runs=specs.map((spec,index)=>{const run=prepareRun(seed,index+1,spec.query);finishDemoRun(run,spec);return run;});
 const auth=prepareRun(seed,4,'查看该人员关联支付宝账户的资金流水');
 auth.query.createdAt='2026-09-29 15:02';auth.query.rewrittenTaskName='围绕关联支付宝账户开展主体核验、资金流水调取与收支分析';auth.query.scope='张三 · 最近30天 · 支付宝账户与资金流水';auth.query.status='waiting_approval';auth.query.finalConclusion='身份与银行卡资料已复用。关联支付宝账户的主体及流水信息需要完成来源访问授权后继续核验，当前不形成完整结论。';auth.query.recommendedQueries=['授权完成后继续核验支付宝流水','先查看已确认的银行卡交易摘要','补充关联支付账号线索'];
 auth.query.subtasks.forEach((task,index)=>task.status=index<2?'done':index===2?'waiting_approval':'dependency_blocked');
 toolsOf(auth).forEach(tool=>{tool.status=['TOOL-PROFILE','TOOL-BANK','TOOL-FLOW','TOOL-PARSE','TOOL-NORM'].includes(tool.baseId)?'done':tool.baseId==='TOOL-NET'?'waiting_approval':'dependency_blocked';delete tool.dueAt;});auth.permissions.forEach(permission=>permission.status='pending');
 auth.query.completedLeafTasks=2;auth.query.totalLeafTasks=5;
 const running=prepareRun(seed,5,'结合前面的资金关系判断是否存在资金归集特征');
 running.query.createdAt='2026-09-29 15:08';running.query.rewrittenTaskName='结合前序资金关系，对交易集中度、转入转出节奏与归集路径开展综合研判';running.query.scope='前序已核验关系 · 最近30天 · 银行及第三方支付流水';running.query.status='running';running.query.finalConclusion='已复用前序身份、账户与交易对手核验结果，正在比对多账户转入后的集中转出节奏。当前为执行中状态，尚不能判断是否形成稳定资金归集模式。';running.query.recommendedQueries=['查看归集时段的明细交易','对比归集账户与二跳账户的关系','生成资金归集特征报告'];
 running.query.subtasks.forEach((task,index)=>task.status=index<3?'done':index===3?'running':'dependency_blocked');
 toolsOf(running).forEach(tool=>{tool.status=tool.baseId==='TOOL-LINK'?'running':tool.baseId==='TOOL-REPORT'?'dependency_blocked':'done';delete tool.error;delete tool.dueAt;});
 const liveTool=toolsOf(running).find(tool=>tool.baseId==='TOOL-LINK');if(liveTool)liveTool.dueAt=Date.now()+120000;running.permissions.forEach(permission=>permission.status='active');running.query.completedLeafTasks=3;running.query.totalLeafTasks=5;
 runs.push(auth,running);return runs;
}
function createSession(){
 const seed=createDemoSeed(),session=current(),fresh=session?.taskId;
 const runs=fresh?[prepareRun(seed,1,session.question)]:createDemoConversation(seed),run=runs[0];
 if(fresh){
  const options={deepThinking:session.deepThinking!==false,tools:session.composerTools||[],skills:session.composerSkills||[],files:session.sourceIds||[]};
  applyComposerOptions(run,options);
  if(options.deepThinking)resetRun(run,'running');else completeQuickRun(run);
  seed.artifacts=[];seed.entities=[];seed.relations=[];
 }
 const published=fresh?[]:runs.flatMap(item=>item.outputs.filter(artifact=>{const tool=toolsOf(item).find(candidate=>candidate.id===artifact.toolCallId);return !tool||['done','reused'].includes(tool.status);}));
 const artifacts=[...seed.artifacts.filter(artifact=>!artifact.queryId&&!artifact.pending),...published].filter((artifact,index,list)=>list.findIndex(item=>item.id===artifact.id)===index);
 const latest=runs.at(-1);
 const ss={...seed,version:SCHEMA_VERSION,queries:runs,activeQueryId:latest.query.id,query:latest.query,agents:latest.agents,permissions:latest.permissions,
  artifacts,ui:{...seed.ui,expandedTools:[],expandedTurns:[],collapsedTurns:[],recommendationOffsets:{},selectedPermissions:latest.permissions.filter(permission=>['pending','requested'].includes(permission.status)).map(permission=>permission.id),highlightUntil:0,messageScrollTop:0,followLatest:true,hasNewProgress:false},draft:'',graph:{zoom:'fit',selected:'SS-E-001'}};
 if(fresh&&run.query.deepThinking)advanceRun(ss,run,Date.now());
 return ss;
}

export function ensureSuperSearchState(){
 const key=current()?.id||'super-search-default';
 state.superSearchSessions ||= {};
 let ss=state.superSearchSessions[key];
 if(!ss||ss.version!==SCHEMA_VERSION){ss=createSession();state.superSearchSessions[key]=ss;}
 state.superSearch=ss;
 const run=activeRun(ss);
 ss.activeQueryId=run.query.id;ss.query=run.query;ss.agents=run.agents;ss.permissions=run.permissions;
 ss.ui.selectedPermissions ||= ss.permissions.filter(p=>['pending','requested'].includes(p.status)).map(p=>p.id);
 if(!Number.isFinite(ss.ui.messageScrollTop))ss.ui.messageScrollTop=0;
 ss.ui.expandedTurns ||= [];
 ss.ui.expandedAgents ||= [];
 ss.ui.expandedTools ||= [];
 ss.ui.expandedSubtasks ||= [];
 ss.ui.expandedFolders ||= [];
 ss.ui.contextChips ||= [];
 ss.ui.collapsedTurns ||= [];
 ss.ui.recommendationOffsets ||= {};
 if(typeof ss.ui.followLatest!=='boolean')ss.ui.followLatest=true;
 if(typeof ss.ui.hasNewProgress!=='boolean')ss.ui.hasNewProgress=false;
 state.graphUI ||= {};state.graphUI.superSearch=ss.graph;
 if(ss.ui.highlightUntil<Date.now())ss.ui.highlightTool=null;
 return ss;
}

export function selectSuperQuery(id){const ss=ensureSuperSearchState();if(!ss.queries.some(run=>run.query.id===id))return;ss.activeQueryId=id;ss.ui.selectedPermissions=ss.queries.find(run=>run.query.id===id).permissions.filter(p=>['pending','requested'].includes(p.status)).map(p=>p.id);return ensureSuperSearchState();}
export function getSuperSearchArtifact(id){return ensureSuperSearchState().artifacts.find(a=>a.id===id);}
export function getSuperSearchTool(id){return allQueryRuns().flatMap(toolsOf).find(t=>t.id===id);}
export function getSuperSearchEntity(id){return ensureSuperSearchState().entities.find(e=>e.id===id);}
export function canStartSuperQuery(query=latestRun(ensureSuperSearchState())?.query){return !query||TERMINAL_QUERY_STATUSES.has(query.status);}

const COMPLETED_LEAF_STATUSES=new Set(['DONE','REUSED']);
const CANCELED_TASK_STATUSES=new Set(['CANCELED','CANCELLED','TERMINATED']);
const FAILED_TASK_STATUSES=new Set(['FAILED','PARTIAL_SUCCESS']);
const PAUSED_TASK_STATUSES=new Set(['PAUSED','WAITING_APPROVAL','SUSPENDED']);
const RUNNING_TASK_STATUSES=new Set(['OPEN','RUNNING','STOPPING','CANCELING']);
const EXECUTING_LEAF_STATUSES=new Set(['RUNNING','DONE','FAILED','PARTIAL_SUCCESS','WAITING_APPROVAL','PAUSED','SUSPENDED','CANCELED','CANCELLED','TERMINATED']);
export function getSuperSearchTaskProgress(query=ensureSuperSearchState().query,now=Date.now()){
 if(!query)return {visible:false,phase:'idle',determinate:false,completed:0,total:null,percent:null,tooltip:'查看研判空间'};
 const leaves=Array.isArray(query.subtasks)?query.subtasks:[],leafStatuses=leaves.map(task=>String(task.status||'').toUpperCase());
 const explicitTotal=Number(query.totalLeafTasks),explicitCompleted=Number(query.completedLeafTasks);
 const hasExplicit=Number.isFinite(explicitTotal)&&explicitTotal>=0&&Number.isFinite(explicitCompleted)&&explicitCompleted>=0;
 const total=hasExplicit?explicitTotal:(leaves.length||null),completed=Math.min(total??Infinity,hasExplicit?explicitCompleted:leafStatuses.filter(status=>COMPLETED_LEAF_STATUSES.has(status)).length);
 const determinate=Number.isFinite(total)&&total>0,percent=determinate?Math.max(0,Math.min(100,Math.round(completed/total*100))):null;
 const rootStatus=String(query.status||'').toUpperCase(),hasCanceledLeaf=leafStatuses.some(status=>CANCELED_TASK_STATUSES.has(status)),hasFailedLeaf=leafStatuses.includes('FAILED'),hasPausedLeaf=leafStatuses.some(status=>PAUSED_TASK_STATUSES.has(status));
 const executionStarted=leafStatuses.some(status=>EXECUTING_LEAF_STATUSES.has(status))||(query.events||[]).some(event=>['tool_started','tool_finished','tool_waiting_approval','tool_canceled'].includes(event.type));
 let phase='idle',visible=false;
 if(CANCELED_TASK_STATUSES.has(rootStatus)||hasCanceledLeaf){phase='canceled';}
 else if(rootStatus==='DONE'){phase='done';visible=now-(query.progressCompletedAt||0)<600;}
 else if(FAILED_TASK_STATUSES.has(rootStatus)||hasFailedLeaf){phase='failed';visible=executionStarted;}
 else if(PAUSED_TASK_STATUSES.has(rootStatus)||hasPausedLeaf){phase='paused';visible=executionStarted;}
 else if(RUNNING_TASK_STATUSES.has(rootStatus)||leafStatuses.includes('RUNNING')){phase='running';visible=executionStarted;}
 const stateText=phase==='failed'?'任务执行失败':phase==='paused'?(rootStatus==='WAITING_APPROVAL'||leafStatuses.includes('WAITING_APPROVAL')?'任务等待审批':'任务已暂停'):phase==='done'?'任务已完成':'任务执行中';
 const detail=determinate?`${completed} / ${total} 个子任务已完成\n${phase==='done'?100:percent}%`:'任务拆解中，暂无法确定总数';
 return {visible,phase,determinate,completed,total,percent:phase==='done'?100:percent,tooltip:visible?`${stateText}\n${detail}`:'查看研判空间'};
}

function resetRun(run,status='awaiting_scope'){
 run.query.status=status;
 run.query.finalConclusion=status==='awaiting_scope'?'请先确认研判对象、时间范围和数据来源；确认前不会启动任何工具。':'正在执行本地合成样本的任务规划，尚无最终结论。';
 run.query.subtasks.forEach(task=>{task.status='pending';task.planVersion=run.query.planVersion||1;delete task.reusedFromPlanVersion;});
 toolsOf(run).forEach(tool=>{tool.status='pending';tool.artifacts=[];tool.trace=[];tool.resultSummary='尚未执行。';tool.planVersion=run.query.planVersion||1;tool.attempt=1;delete tool.error;delete tool.dueAt;delete tool.reusedFromPlanVersion;});
 run.permissions.forEach(permission=>{permission.status='unrequested';delete permission.applicationId;});
 emitQueryEvent(run,'query_created',{status},`query-created:${run.query.id}`);
}

function applyComposerOptions(run,options={}){
 run.query.deepThinking=options.deepThinking!==false;
 run.query.selectedTools=[...(options.tools||[])];
 run.query.selectedSkills=[...(options.skills||[])];
 run.query.selectedFiles=[...(options.files||[])];
}
function completeQuickRun(run){
 const query=run.query;
 query.mode='quick';query.status='done';query.rewrittenTaskName=`直接回答「${query.originalQuery}」`;query.scope='当前对话 · 不启动深度研判';
 query.finalConclusion='已按普通问答模式完成。本次未启动深度研判、Agent 拆解或工具执行；如需多步骤研判，请开启“深度思考”后重新提问。';
 query.finalArtifacts=[];query.subtasks=[{id:`${query.id}-QUICK`,index:'01',name:'生成普通问答回复',status:'done',planVersion:1}];
 query.completedLeafTasks=1;query.totalLeafTasks=1;query.progressCompletedAt=Date.now();
 run.agents=[];run.permissions=[];run.outputs=[];
 emitQueryEvent(run,'query_created',{status:'done',mode:'quick'},`query-created:${query.id}:quick`);
}
export function startSuperQuery(text,options={}){
 const ss=ensureSuperSearchState();
 if(!canStartSuperQuery(latestRun(ss)?.query))throw Error('当前最新一轮尚未结束，请先完成、终止或等待其进入终态。');
 const run=prepareRun(createDemoSeed(),ss.queries.length+1,text);
 applyComposerOptions(run,options);
 if(run.query.deepThinking)resetRun(run,'awaiting_scope');else completeQuickRun(run);
 ss.queries.push(run);ss.activeQueryId=run.query.id;ss.draft='';ss.ui.expandedFolders.push(run.query.id);ss.ui.expandedTools=[];ss.ui.followLatest=true;ss.ui.hasNewProgress=false;
 ensureSuperSearchState();return run;
}

export function confirmSuperQueryScope(scope={}){
 const ss=ensureSuperSearchState(),run=activeRun(ss),query=run.query;
 if(query.status!=='awaiting_scope')return false;
 query.scopeDetails={...query.scopeDetails,...scope,sources:Array.isArray(scope.sources)?scope.sources:query.scopeDetails.sources};
 if(!query.scopeDetails.subject||!query.scopeDetails.startDate||!query.scopeDetails.endDate)throw Error('请完整填写研判对象与时间范围。');
 if(query.scopeDetails.startDate>query.scopeDetails.endDate)throw Error('起始日期不能晚于结束日期。');
 query.scope=scopeLabel(query.scopeDetails);query.scopeConfirmedAt=Date.now();query.status='awaiting_plan';
 query.finalConclusion='范围已确认。请核对任务计划；计划确认前工具保持待执行。';
 emitQueryEvent(run,'scope_confirmed',{status:query.status,scope:query.scope},`scope-confirmed:v${query.planVersion}`);
 return true;
}

export function confirmSuperQueryPlan(){
 const ss=ensureSuperSearchState(),run=activeRun(ss),query=run.query;
 if(query.status!=='awaiting_plan')return false;
 query.planConfirmedAt=Date.now();query.status='running';query.finalConclusion='计划已确认，正在按依赖顺序执行本地合成样本。';
 emitQueryEvent(run,'plan_confirmed',{status:'running',planVersion:query.planVersion},`plan-confirmed:v${query.planVersion}`);
 advanceRun(ss,run,Date.now());return true;
}

/** A Permission Request is deduplicated by permission code within its Query. */
export function aggregatePermissions(run){
 const byCode=new Map();
 for(const permission of run.permissions){const existing=byCode.get(permission.permissionCode);if(!existing){byCode.set(permission.permissionCode,permission);continue;}
  existing.relatedToolCallIds=[...new Set([...existing.relatedToolCallIds,...permission.relatedToolCallIds])];
  existing.relatedSubtaskIds=[...new Set([...existing.relatedSubtaskIds,...permission.relatedSubtaskIds])];
  toolsOf(run).filter(tool=>tool.permissionRequestId===permission.id).forEach(tool=>tool.permissionRequestId=existing.id);
  run.query.subtasks.forEach(task=>{if(task.permissionRequests)task.permissionRequests=[...new Set(task.permissionRequests.map(id=>id===permission.id?existing.id:id))];});
 }
 run.permissions=[...byCode.values()];return run.permissions;
}

export function requestSuperSearchPermission(id='all'){
 const ss=ensureSuperSearchState(),run=runForPermission(ss,id);if(!run)return null;aggregatePermissions(run);
 state.applications ||= [];
 const selected=run.permissions.filter(permission=>['pending','unrequested','canceled'].includes(permission.status)&&(id==='all'?ss.ui.selectedPermissions.includes(permission.id):permission.id===id));
 if(!selected.length)return null;
 const created=[];
 for(const permission of selected){
  let application=state.applications.find(a=>a.queryId===run.query.id&&a.permissionCode===permission.permissionCode&&['待审批','已批准','已激活'].includes(a.status));
  if(!application){application={id:uid('APR'),name:permission.permissionName,resource:permission.permissionCode,permissionId:permission.id,permissionCode:permission.permissionCode,queryId:run.query.id,superSearchSessionKey:current()?.id||'super-search-default',range:run.query.scope,purpose:`完成 ${permission.relatedSubtaskIds.join('、')} 的最小范围来源核验`,duration:'24小时',applicant:state.user,org:state.org,session:current()?.id||null,status:'待审批',reason:'',relatedSubtaskIds:[...permission.relatedSubtaskIds],relatedToolCallIds:[...permission.relatedToolCallIds],checkpointId:`${run.query.id}:${permission.id}:checkpoint`};state.applications.unshift(application);}
  permission.status='requested';permission.applicationId=application.id;permission.requestedAt=Date.now();created.push(application);
  emitQueryEvent(run,'permission_requested',{permissionId:permission.id,applicationId:application.id,status:'requested'},`permission-requested:${permission.id}:${application.id}`);
 }
 deriveTask(run);return created;
}

// Kept as a compatibility helper for focused model tests. UI never self-approves.
export function approveSuperSearchPermission(id='all'){
 const ss=ensureSuperSearchState(),run=runForPermission(ss,id);if(!run)return null;aggregatePermissions(run);
 const selected=run.permissions.filter(permission=>['pending','requested'].includes(permission.status)&&(id==='all'?ss.ui.selectedPermissions.includes(permission.id):permission.id===id));
 if(!selected.length)return false;
 for(const permission of selected){permission.status='active';permission.approvedAt=Date.now();permission.activatedAt=Date.now();for(const tool of toolsOf(run).filter(t=>permission.relatedToolCallIds.includes(t.id))){tool.status='pending';delete tool.error;tool.trace.push('测试辅助授权已激活，从检查点恢复');}emitQueryEvent(run,'permission_activated',{permissionId:permission.id,status:'active'},`permission-activated:${permission.id}`);}
 run.query.status='running';advanceRun(ss,run,Date.now());return true;
}
export function completeSuperSearchPermissionFlow(){/* Persisted scheduler resumes from the explicit Query checkpoint. */}

export function markSuperSearchPermissionApproved(applicationId){
 const application=(state.applications||[]).find(a=>a.id===applicationId);if(!application?.queryId)return false;
 const ss=Object.values(state.superSearchSessions||{}).find(item=>item.queries.some(run=>run.query.id===application.queryId));
 const run=ss?.queries.find(item=>item.query.id===application.queryId),permission=run?.permissions.find(item=>item.id===application.permissionId||item.permissionCode===application.permissionCode);if(!permission)return false;
 permission.status='approved';permission.approvedAt=Date.now();emitQueryEvent(run,'permission_approved',{permissionId:permission.id,applicationId,status:'approved'},`permission-approved:${applicationId}`);deriveTask(run);return true;
}

export function activateSuperSearchApproval(applicationId){
 const application=(state.applications||[]).find(a=>a.id===applicationId);if(!application?.queryId||application.status!=='已批准')return false;
 const ss=Object.values(state.superSearchSessions||{}).find(item=>item.queries.some(run=>run.query.id===application.queryId));
 const run=ss?.queries.find(item=>item.query.id===application.queryId),permission=run?.permissions.find(item=>item.id===application.permissionId||item.permissionCode===application.permissionCode);if(!permission)return false;
 application.status='已激活';application.activatedAt=Date.now();permission.status='active';permission.activatedAt=Date.now();run.query.resumeAvailable=true;
 emitQueryEvent(run,'permission_activated',{permissionId:permission.id,applicationId,status:'active'},`permission-activated:${applicationId}`);deriveTask(run);return true;
}

export function resumeSuperSearchQuery(queryId){
 const ss=ensureSuperSearchState(),run=ss.queries.find(item=>item.query.id===(queryId||ss.activeQueryId));if(!run||!run.query.resumeAvailable||run.query.status!=='waiting_approval')return false;
 for(const permission of run.permissions.filter(item=>item.status==='active'))for(const tool of toolsOf(run).filter(item=>permission.relatedToolCallIds.includes(item.id)&&item.status==='waiting_approval')){tool.status='pending';delete tool.error;tool.trace.push('授权已审批并激活，用户确认从检查点恢复');}
 run.query.resumeAvailable=false;run.query.resumedAt=Date.now();run.query.status='running';emitQueryEvent(run,'query_resumed',{status:'running'},`query-resumed:v${run.query.planVersion}:${run.query.resumedAt}`);advanceRun(ss,run,Date.now());return true;
}

export function cancelSuperSearchPermission(id='all'){
 const ss=ensureSuperSearchState(),run=runForPermission(ss,id);if(!run)return false;
 const selected=run.permissions.filter(permission=>['pending','requested'].includes(permission.status)&&(id==='all'?ss.ui.selectedPermissions.includes(permission.id):permission.id===id));
 for(const permission of selected){permission.status='canceled';toolsOf(run).filter(tool=>permission.relatedToolCallIds.includes(tool.id)).forEach(tool=>tool.status='canceled');emitQueryEvent(run,'permission_canceled',{permissionId:permission.id,status:'canceled'},`permission-canceled:${permission.id}`);}
 deriveTask(run);return selected.length>0;
}
export function reopenSuperPermission(id){const ss=ensureSuperSearchState(),run=runForPermission(ss,id),permission=run?.permissions.find(item=>item.id===id);if(!permission)return;permission.status='pending';delete permission.applicationId;for(const tool of toolsOf(run).filter(item=>permission.relatedToolCallIds.includes(item.id)))tool.status='waiting_approval';if(!ss.ui.selectedPermissions.includes(id))ss.ui.selectedPermissions.push(id);deriveTask(run);}

export function requestStopSuperQuery(queryId){
 const ss=ensureSuperSearchState(),run=ss.queries.find(item=>item.query.id===(queryId||ss.activeQueryId));if(!run||TERMINAL_QUERY_STATUSES.has(run.query.status))return false;
 const now=Date.now();run.query.status='stopping';run.query.stopRequestedAt=now;run.query.resumeAvailable=false;
 for(const tool of toolsOf(run)){if(tool.status==='running'){tool.status='canceling';tool.dueAt=now+250;tool.trace.push('收到 Query 终止请求，正在取消当前执行');}else if(['pending','dependency_blocked','waiting_approval','paused'].includes(tool.status))tool.status='canceled';}
 emitQueryEvent(run,'stop_requested',{status:'stopping'},`stop-requested:${now}`);deriveTask(run);return true;
}

export function replanSuperQuery(changes='调整后续分析范围',queryId){
 const ss=ensureSuperSearchState(),run=ss.queries.find(item=>item.query.id===(queryId||ss.activeQueryId))||latestRun(ss),query=run.query;
 if(['awaiting_scope','awaiting_plan','stopping','terminated'].includes(query.status))return false;
 const previous=query.planVersion||1;
 query.previousPlans ||= [];
 query.previousPlans.push({version:previous,at:Date.now(),reason:changes,subtasks:structuredClone(query.subtasks),toolCalls:structuredClone(toolsOf(run))});
 query.planVersion=previous+1;query.planConfirmedAt=null;query.status='awaiting_plan';query.replanReason=changes;query.finalConclusion='已生成新计划。已完成步骤将复用，只有新增或受影响步骤会在确认后执行。';
 for(const task of query.subtasks){if(task.status==='done'){task.status='reused';task.reusedFromPlanVersion=previous;}else {task.status='pending';task.planVersion=query.planVersion;}}
 for(const tool of toolsOf(run)){if(tool.status==='done'){tool.status='reused';tool.reusedFromPlanVersion=previous;}else {tool.status='pending';tool.planVersion=query.planVersion;tool.attempt=(tool.attempt||1)+1;delete tool.dueAt;delete tool.error;}}
 emitQueryEvent(run,'query_replanned',{status:'awaiting_plan',planVersion:query.planVersion,previousPlanVersion:previous},`replanned:v${query.planVersion}`);return true;
}

export function controlSuperTool(id,action){const ss=ensureSuperSearchState(),run=ss.queries.find(item=>toolsOf(item).some(tool=>tool.id===id)),tool=run&&toolsOf(run).find(item=>item.id===id);if(!tool)return;
 if(action==='pause'&&tool.status==='running')tool.status='paused';
 if(action==='resume'&&['paused','failed'].includes(tool.status)){tool.status='pending';delete tool.error;delete tool.demoFailure;if(['failed','partial_success'].includes(run.query.status))run.query.status='running';}
 advanceRun(ss,run,Date.now());
}

function deriveTask(run){
 const tools=toolsOf(run),query=run.query,previousStatus=query.status;
 if(query.status==='stopping'){
  if(!tools.some(tool=>['running','canceling'].includes(tool.status))){query.status='terminated';query.terminatedAt=Date.now();query.finalConclusion='本轮 Query 已终止。未完成工具已取消，迟到完成事件不会覆盖终止状态。';emitQueryEvent(run,'query_terminated',{status:'terminated'},`query-terminated:${query.stopRequestedAt}`);}
  return;
 }
 if(['awaiting_scope','awaiting_plan','terminated'].includes(query.status))return;
 for(const task of query.subtasks){const assigned=tools.filter(tool=>tool.subtaskId===task.id),depReady=task.dependencies.every(id=>['done','reused'].includes(query.subtasks.find(item=>item.id===id)?.status));
  task.status=assigned.length&&assigned.every(tool=>['done','reused'].includes(tool.status))?(assigned.every(tool=>tool.status==='reused')?'reused':'done')
   :assigned.some(tool=>tool.status==='failed')?'failed'
   :assigned.some(tool=>tool.status==='waiting_approval')?'waiting_approval'
   :assigned.some(tool=>tool.status==='canceled')?'canceled'
   :assigned.some(tool=>tool.status==='paused')?'paused'
   :assigned.some(tool=>['running','canceling'].includes(tool.status))?'running'
   :!depReady?'dependency_blocked':'pending';
 }
 const statuses=query.subtasks.map(task=>task.status);
 query.status=statuses.every(status=>['done','reused'].includes(status))?'done'
  :statuses.some(status=>status==='failed')&&statuses.some(status=>['done','reused'].includes(status))?'partial_success'
  :statuses.includes('failed')?'failed'
  :statuses.includes('waiting_approval')?'waiting_approval'
  :statuses.includes('running')?'running'
  :statuses.some(status=>['canceled','paused'].includes(status))?'partial_success':'pending';
 if(query.status==='done'&&tools.some(tool=>tool.demoEmpty||tool.dataGap))query.finalConclusion='本轮执行结束，但部分来源返回空结果，下游统计与关系分析缺少必要输入；未生成完整核验结论。请补充材料或重新查询，未发现不代表不存在。';
 else if(query.status==='done')query.finalConclusion='合成样本的身份、银行卡与第三方支付账户核验已完成。收支分析命中 6 笔待核验高频交易，发现 1 条两跳资金关联路径。规则命中不等于违法事实，须人工复核原始材料。';
 else if(query.status==='partial_success')query.finalConclusion='部分步骤已完成并保留来源引用，其余步骤失败或取消。本轮结果为部分成功，需人工确认是否重规划。';
 if(query.status==='done'&&previousStatus!=='done')query.progressCompletedAt=Date.now();
 else if(query.status!=='done')delete query.progressCompletedAt;
 if(TERMINAL_QUERY_STATUSES.has(query.status))emitQueryEvent(run,'query_finished',{status:query.status},`query-finished:${query.status}:v${query.planVersion}`);
}


const refKey=ref=>[ref.queryId,ref.subtaskId,ref.toolCallId,ref.artifactId].join('|');
export function mergeSuperEntities(ss,entities,relations){
 const mapping=new Map();
 for(const entity of entities){const stable=entity.stableKey||entity.type+':'+(entity.properties?.身份证号||entity.properties?.银行卡号||entity.properties?.手机号||entity.properties?.账号||entity.name);let existing=ss.entities.find(item=>(item.stableKey||item.type+':'+(item.properties?.身份证号||item.properties?.银行卡号||item.properties?.手机号||item.properties?.账号||item.name))===stable);
  if(existing){const refs=new Map([...existing.sourceRefs,...entity.sourceRefs].map(ref=>[refKey(ref),ref]));existing.sourceRefs=[...refs.values()];mapping.set(entity.id,existing.id);}else {existing={...entity,stableKey:stable};ss.entities.push(existing);mapping.set(entity.id,entity.id);}}
 for(const relation of relations){const next={...relation,from:mapping.get(relation.from)||relation.from,to:mapping.get(relation.to)||relation.to};const old=ss.relations.find(item=>item.from===next.from&&item.to===next.to&&item.type===next.type);if(old)old.sourceRefs=[...new Map([...old.sourceRefs,...next.sourceRefs].map(ref=>[refKey(ref),ref])).values()];else ss.relations.push(next);}
}

function publishResult(ss,run,tool){
 const outputs=run.outputs.filter(artifact=>artifact.toolCallId===tool.id);
 tool.dataGap=tool.dependencies.some(id=>{const dep=toolsOf(run).find(item=>item.id===id);return dep?.demoEmpty||dep?.dataGap;});
 if(tool.dataGap&&tool.baseId==='TOOL-REPORT')for(const artifact of outputs)artifact.dataGap=true;
 if(tool.demoEmpty||(tool.dataGap&&tool.baseId!=='TOOL-REPORT')){tool.resultSummary=tool.demoEmpty?'查询成功，返回 0 条记录；未发现不代表不存在。':'缺少必要的上游记录，未生成统计与关系结论。';tool.artifacts=[];return;}
 for(const artifact of outputs)if(!ss.artifacts.some(item=>item.id===artifact.id))ss.artifacts.push({...artifact,pending:false});
 tool.artifacts=outputs.map(artifact=>artifact.id);
 tool.resultSummary=tool.baseId==='TOOL-LINK'?'识别 6 笔待核验交易与 1 条两跳关联路径。':tool.baseId==='TOOL-METRIC'?'收支统计完成：流入 ¥286,400，流出 ¥249,800。':tool.baseId==='TOOL-NET'?'模拟查询成功，返回 1 个第三方支付账号。':tool.baseId==='TOOL-REPORT'?'研判报告已生成，包含来源引用与数据缺口说明。':outputs[0]?.preview||'处理完成，来源引用已保留。';
 const entities=run.graphSeed.entities.filter(entity=>entity.sourceRefs.some(ref=>ref.toolCallId===tool.id)),relations=run.graphSeed.relations.filter(relation=>relation.sourceRefs.some(ref=>ref.toolCallId===tool.id));
 if(tool.baseId==='TOOL-NET'){
  const ref={queryId:run.query.id,subtaskId:tool.subtaskId,toolCallId:tool.id,artifactId:tool.artifacts[0]};
  entities.push({id:'SS-E-NET',type:'网络账号',name:'微信账号 wx_demo_zhangsan',title:'wx_demo_zhangsan',icon:'net',summary:'微信支付 · 合成主体',state:'Success',properties:{账号:'wx_demo_zhangsan',实名主体:'张三（合成）'},sourceRefs:[ref]});relations.push({id:'SS-R-NET',from:'SS-E-001',to:'SS-E-NET',type:'注册',sourceRefs:[ref]});
 }
 if(tool.baseId==='TOOL-LINK'){
  const ref={queryId:run.query.id,subtaskId:tool.subtaskId,toolCallId:tool.id,artifactId:tool.artifacts[0]};
  entities.push({id:'SS-E-006',type:'账户',name:'银行卡 6214 **** 0921',title:'银行卡 6214 **** 0921',icon:'funds',summary:'二跳对手方 · 待核验',state:'Idle',properties:{银行卡号:'6214 **** 0921',核验状态:'待核验'},sourceRefs:[ref]});relations.push({id:'SS-R-LINK',from:'SS-E-004',to:'SS-E-006',type:'转账',inferred:true,sourceRefs:[ref]});
 }
 mergeSuperEntities(ss,entities,relations);
}

function dependencyDone(tools,id){return ['done','reused'].includes(tools.find(tool=>tool.id===id)?.status);}
function advanceRun(ss,run,time){
 const query=run.query,tools=toolsOf(run);let changed=false;
 if(query.status==='stopping'){
  for(const tool of tools.filter(item=>item.status==='canceling'&&item.dueAt<=time)){tool.status='canceled';tool.duration='已取消';tool.trace.push('取消完成；忽略后续迟到结果');emitQueryEvent(run,'tool_canceled',{toolCallId:tool.id,status:'canceled'},`tool-canceled:${tool.id}:${query.stopRequestedAt}`);changed=true;}
  const before=query.status;deriveTask(run);return changed||before!==query.status;
 }
 if(query.status!=='running')return false;
 for(const tool of tools.filter(item=>item.status==='running'&&item.dueAt<=time)){
  tool.status=tool.demoFailure?'failed':'done';tool.duration=tool.simulatedDuration;tool.trace.push(tool.demoFailure?'模拟请求超时，可重试':'完成处理并写入来源引用');
  if(tool.demoFailure)tool.error={code:'DEMO_TIMEOUT',message:'模拟服务超时，请重试。'};else publishResult(ss,run,tool);
  emitQueryEvent(run,'tool_finished',{toolCallId:tool.id,status:tool.status,planVersion:tool.planVersion},`tool-finished:${tool.id}:attempt-${tool.attempt}`);changed=true;
 }
 for(const tool of tools){if(!['pending','dependency_blocked'].includes(tool.status)||!tool.dependencies.every(id=>dependencyDone(tools,id)))continue;
  const permission=run.permissions.find(item=>item.id===tool.permissionRequestId||item.relatedToolCallIds.includes(tool.id));
  if(permission&&!['active'].includes(permission.status)){
   if(permission.status==='canceled'){tool.status='canceled';changed=true;continue;}
   if(permission.status==='unrequested')permission.status='pending';tool.status='waiting_approval';tool.error={code:'403_FORBIDDEN',message:'缺少受限来源访问权限。'};if(!ss.ui.selectedPermissions.includes(permission.id))ss.ui.selectedPermissions.push(permission.id);emitQueryEvent(run,'tool_waiting_approval',{toolCallId:tool.id,permissionId:permission.id,status:'waiting_approval'},`tool-waiting:${tool.id}:v${query.planVersion}`);changed=true;continue;
  }
  tool.status='running';tool.dueAt=time+1000;tool.duration='执行中';tool.trace.push('开始执行本地合成样本');emitQueryEvent(run,'tool_started',{toolCallId:tool.id,status:'running',planVersion:tool.planVersion},`tool-started:${tool.id}:attempt-${tool.attempt}`);changed=true;
 }
 const before=query.status;deriveTask(run);return changed||before!==query.status;
}

export function tickSuperSearch(time=Date.now()){
 if(!state.network)return false;
 let changed=false;
 for(const ss of Object.values(state.superSearchSessions||{}))for(const run of ss.queries){
  if(run.query.status==='stopping'||run.query.status==='running'||toolsOf(run).some(tool=>['running','canceling'].includes(tool.status)))changed=advanceRun(ss,run,time)||changed;
 }
 return changed;
}

export function getSuperSearchFundProjection(queryId,artifactId){
 const ss=ensureSuperSearchState(),run=ss.queries.find(item=>item.query.id===queryId),artifact=ss.artifacts.find(item=>item.id===artifactId&&item.queryId===queryId);
 if(!run||!artifact)return null;
 return {queryId,artifactId,query:run.query.originalQuery,scope:run.query.scope,artifactName:artifact.name,sourceToolId:artifact.toolCallId,currency:'CNY',account:'DEMO-ACCOUNT-A',rows:[
  {id:'T001',counterparty:'演示商户B',amount:'12,000.00',status:'有效',source:`${artifact.id} / 第2行`},
  {id:'T002',counterparty:'演示商户B',amount:'5,000.00',status:'有效',source:`${artifact.id} / 第3行`},
  {id:'T003',counterparty:'演示账户C',amount:'3,000.00',status:'有效',source:`${artifact.id} / 第4行`},
  {id:'T004',counterparty:'演示账户A',amount:'2,000.00',status:'冲正',source:`${artifact.id} / 第5行`}
 ]};
}

// Layout belongs to PG05, not a query run or another page's shared session UI.
export function ensureSuperSearchLayout(){
 const layout=state.superSearchLayout ||= {leftCollapsed:false,workspaceExpanded:true,newTaskWorkspaceExpanded:false,historySearch:'',sessionMenuId:null,pinnedSessions:[],newTaskTab:'工作空间'};
 if(typeof layout.workspaceExpanded!=='boolean')layout.workspaceExpanded=typeof layout.rightCollapsed==='boolean'?!layout.rightCollapsed:true;
 if(typeof layout.newTaskWorkspaceExpanded!=='boolean')layout.newTaskWorkspaceExpanded=false;
 delete layout.rightCollapsed;
 layout.pinnedSessions ||= [];
 layout.newTaskTab ||= '工作空间';
 if(!['new','history',null].includes(layout.composerMenuOpen))layout.composerMenuOpen=null;
 layout.deepThinking ||= {};
 if(typeof layout.deepThinking.new!=='boolean')layout.deepThinking.new=true;
 if(typeof layout.deepThinking.history!=='boolean')layout.deepThinking.history=true;
 layout.composerSelections ||= {};
 for(const context of ['new','history']){
  layout.composerSelections[context] ||= {};
  for(const type of ['files','tools','skills'])if(!Array.isArray(layout.composerSelections[context][type]))layout.composerSelections[context][type]=[];
 }
 return layout;
}
