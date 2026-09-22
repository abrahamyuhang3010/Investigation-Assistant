import {state,current} from './state.js';
import {createDemoSeed} from './super-search-data.js';

const INFO='information-retrieval-agent', ANALYSIS='data-analysis-agent';
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
const toolsOf=run=>run.agents.flatMap(a=>a.toolCalls);
function prepareRun(seed,number=1,originalQuery){
 const suffix=number===1?'':`-Q${number}`;
 const ids=new Set([...seed.query.subtasks.map(s=>s.id),...seed.agents.flatMap(a=>a.toolCalls.map(t=>t.id)),...seed.permissions.map(p=>p.id),...seed.artifacts.filter(a=>a.queryId).map(a=>a.id),...Object.values(generated).map(a=>a.id)]);
 const convert=value=>typeof value==='string'?(ids.has(value)?value+suffix:value==='QUERY-01'?`QUERY-${String(number).padStart(2,'0')}`:value):Array.isArray(value)?value.map(convert):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,convert(v)])):value;
 const run=convert({query:seed.query,agents:seed.agents,permissions:seed.permissions});
 run.query.createdAt=new Date().toLocaleString('zh-CN',{hour12:false});
 if(originalQuery){run.query.originalQuery=originalQuery;run.query.rewrittenTaskName=`围绕「${originalQuery}」开展线索核验与关联分析`;}
 run.outputs=convert(seed.artifacts.filter(a=>a.queryId));
 run.outputs.find(a=>a.id==='ART-REPORT'+suffix).pending=false;
 run.outputs.push(...Object.entries(generated).map(([base,a])=>({...convert(a),sourceType:base==='TOOL-NET'?'tool_output':'analysis_output',queryId:run.query.id,toolCallId:base+suffix,agentId:base==='TOOL-NET'?INFO:ANALYSIS,subtaskId:(base==='TOOL-NET'?'ST-03':'ST-04')+suffix})));
 for(const agent of run.agents)for(const tool of agent.toolCalls){
  tool.baseId=tool.id.replace(/-Q\d+$/,'');tool.agentId=agent.id;tool.queryId=run.query.id;
  tool.dependencies=(dependencies[tool.baseId]||[]).map(id=>id+suffix);
  tool.outputIds=run.outputs.filter(a=>a.toolCallId===tool.id).map(a=>a.id);
  tool.simulatedDuration=tool.duration==='—'?'8s':tool.duration;
 }
 run.graphSeed=convert({entities:seed.entities,relations:seed.relations});
 return run;
}
function createSession(){
 const seed=createDemoSeed(),session=current(),fresh=session?.taskId,run=prepareRun(seed,1,fresh?session.question:undefined);
 if(fresh){resetRun(run);seed.artifacts=[];seed.entities=[];seed.relations=[];}
 const ss= {...seed,version:2,queries:[run],activeQueryId:run.query.id,query:run.query,agents:run.agents,permissions:run.permissions,
  artifacts:seed.artifacts.filter(a=>!a.pending),ui:{...seed.ui,expandedTools:[],selectedPermissions:['PERM-NET'],highlightUntil:0},draft:'',graph:{zoom:'fit',selected:'SS-E-001'}};
 if(fresh)advanceRun(ss,run,Date.now());return ss;
}
export function ensureSuperSearchState(){
 const key=current()?.id||'super-search-default';
 state.superSearchSessions ||= {};
 let ss=state.superSearchSessions[key];
 if(!ss||ss.version!==2){ss=createSession();state.superSearchSessions[key]=ss;}
 state.superSearch=ss;
 const run=ss.queries.find(r=>r.query.id===ss.activeQueryId)||ss.queries[0];
 ss.query=run.query;ss.agents=run.agents;ss.permissions=run.permissions;
 ss.ui.selectedPermissions ||= ss.permissions.filter(p=>p.status==='pending').map(p=>p.id);
 state.graphUI ||= {};state.graphUI.superSearch=ss.graph;
 if(ss.ui.highlightUntil<Date.now())ss.ui.highlightTool=null;
 return ss;
}
export function selectSuperQuery(id){const ss=ensureSuperSearchState();if(!ss.queries.some(r=>r.query.id===id))return;ss.activeQueryId=id;ss.ui.selectedPermissions=ss.queries.find(r=>r.query.id===id).permissions.filter(p=>p.status==='pending').map(p=>p.id);return ensureSuperSearchState()}
export function getSuperSearchArtifact(id){return ensureSuperSearchState().artifacts.find(a=>a.id===id)}
export function getSuperSearchTool(id){return allQueryRuns().flatMap(toolsOf).find(t=>t.id===id)}
export function getSuperSearchEntity(id){return ensureSuperSearchState().entities.find(e=>e.id===id)}
function resetRun(run){
 run.query.status='running';run.query.finalConclusion='正在执行本地合成样本的任务规划，尚无最终结论。';
 run.query.subtasks.forEach(s=>s.status='pending');
 toolsOf(run).forEach(t=>{t.status='pending';t.artifacts=[];t.trace=[];t.resultSummary='尚未执行。';delete t.error;});
 run.permissions.forEach(p=>p.status='unrequested');
}
export function startSuperQuery(text){
 const ss=ensureSuperSearchState(),run=prepareRun(createDemoSeed(),ss.queries.length+1,text);
 resetRun(run);
 ss.queries.push(run);ss.activeQueryId=run.query.id;ss.draft='';ss.ui.expandedFolders.push(run.query.id);ss.ui.expandedTools=[];
 ensureSuperSearchState();advanceRun(ss,run,Date.now());return run;
}
/** A Permission Request is deduplicated by permission code within its Query. */
export function aggregatePermissions(run){
 const byCode=new Map();
 for(const p of run.permissions){const existing=byCode.get(p.permissionCode);if(!existing){byCode.set(p.permissionCode,p);continue;}
  existing.relatedToolCallIds=[...new Set([...existing.relatedToolCallIds,...p.relatedToolCallIds])];
  existing.relatedSubtaskIds=[...new Set([...existing.relatedSubtaskIds,...p.relatedSubtaskIds])];
  toolsOf(run).filter(t=>t.permissionRequestId===p.id).forEach(t=>t.permissionRequestId=existing.id);
  run.query.subtasks.forEach(s=>{if(s.permissionRequests)s.permissionRequests=[...new Set(s.permissionRequests.map(id=>id===p.id?existing.id:id))]});
 }
 run.permissions=[...byCode.values()];return run.permissions;
}
export function approveSuperSearchPermission(id='all'){
 const ss=ensureSuperSearchState(),run=ss.queries.find(r=>r.query.id===ss.activeQueryId);aggregatePermissions(run);
 const selected=run.permissions.filter(p=>p.status==='pending'&&(id==='all'?ss.ui.selectedPermissions.includes(p.id):p.id===id));
 if(!selected.length)return false;
 for(const p of selected){p.status='approved';p.approvedAt=Date.now();for(const tool of toolsOf(run).filter(t=>p.relatedToolCallIds.includes(t.id))){tool.status='pending';delete tool.error;tool.trace.push('模拟授权通过，从检查点恢复');}}
 advanceRun(ss,run,Date.now());return true;
}
export function completeSuperSearchPermissionFlow(){/* The shared persisted scheduler resumes on the next tick, including after reload. */}
export function cancelSuperSearchPermission(id='all'){
 const ss=ensureSuperSearchState(),run=ss.queries.find(r=>r.query.id===ss.activeQueryId);
 const selected=run.permissions.filter(p=>p.status==='pending'&&(id==='all'?ss.ui.selectedPermissions.includes(p.id):p.id===id));
 for(const p of selected){p.status='canceled';toolsOf(run).filter(t=>p.relatedToolCallIds.includes(t.id)).forEach(t=>t.status='canceled');}
 deriveTask(run);return selected.length>0;
}
export function reopenSuperPermission(id){const ss=ensureSuperSearchState(),run=ss.queries.find(r=>r.query.id===ss.activeQueryId),p=run.permissions.find(p=>p.id===id);if(!p)return;p.status='pending';for(const t of toolsOf(run).filter(t=>p.relatedToolCallIds.includes(t.id)))t.status='waiting_approval';if(!ss.ui.selectedPermissions.includes(id))ss.ui.selectedPermissions.push(id);deriveTask(run);}
export function controlSuperTool(id,action){const ss=ensureSuperSearchState(),run=ss.queries.find(r=>toolsOf(r).some(t=>t.id===id)),t=run&&toolsOf(run).find(t=>t.id===id);if(!t)return;
 if(action==='pause'&&t.status==='running')t.status='paused';
 if(action==='resume'&&['paused','failed'].includes(t.status)){t.status='pending';delete t.error;delete t.demoFailure;}
 advanceRun(ss,run,Date.now());
}
function deriveTask(run){
 const tools=toolsOf(run);
 for(const s of run.query.subtasks){const assigned=tools.filter(t=>t.subtaskId===s.id),depReady=s.dependencies.every(id=>run.query.subtasks.find(s=>s.id===id)?.status==='done');
  s.status=assigned.length&&assigned.every(t=>t.status==='done')?'done':assigned.some(t=>t.status==='failed')?'failed':assigned.some(t=>t.status==='waiting_approval')?'waiting_approval':assigned.some(t=>t.status==='canceled')?'canceled':assigned.some(t=>t.status==='paused')?'paused':assigned.some(t=>t.status==='running')?'running':!depReady?'dependency_blocked':'pending';
 }
 const statuses=run.query.subtasks.map(s=>s.status);
 run.query.status=statuses.every(s=>s==='done')?'done':statuses.includes('failed')?'failed':statuses.includes('waiting_approval')?'waiting_approval':statuses.includes('running')?'running':statuses.some(s=>['canceled','paused'].includes(s))?'paused':'pending';
 if(run.query.status==='done'&&tools.some(t=>t.demoEmpty||t.dataGap))run.query.finalConclusion='本轮执行结束，但部分来源返回空结果，下游统计与关系分析缺少必要输入；未生成完整核验结论。请补充材料或重新查询，未发现不代表不存在。';
 else if(run.query.status==='done')run.query.finalConclusion='合成样本的身份、银行卡与第三方支付账户核验已完成。收支分析命中 6 笔待核验高频交易，发现 1 条两跳资金关联路径。规则命中不等于违法事实，须人工复核原始材料。';
}
const refKey=r=>[r.queryId,r.subtaskId,r.toolCallId,r.artifactId].join('|');
export function mergeSuperEntities(ss,entities,relations){
 const mapping=new Map();
 for(const e of entities){const stable=e.stableKey||e.type+':'+(e.properties?.身份证号||e.properties?.银行卡号||e.properties?.手机号||e.properties?.账号||e.name);let existing=ss.entities.find(x=>(x.stableKey||x.type+':'+(x.properties?.身份证号||x.properties?.银行卡号||x.properties?.手机号||x.properties?.账号||x.name))===stable);
  if(existing){const refs=new Map([...existing.sourceRefs,...e.sourceRefs].map(r=>[refKey(r),r]));existing.sourceRefs=[...refs.values()];mapping.set(e.id,existing.id);}else {existing={...e,stableKey:stable};ss.entities.push(existing);mapping.set(e.id,e.id);}}
 for(const r of relations){const next={...r,from:mapping.get(r.from)||r.from,to:mapping.get(r.to)||r.to};const old=ss.relations.find(x=>x.from===next.from&&x.to===next.to&&x.type===next.type);if(old)old.sourceRefs=[...new Map([...old.sourceRefs,...next.sourceRefs].map(r=>[refKey(r),r])).values()];else ss.relations.push(next);}
}
function publishResult(ss,run,tool){
 const outputs=run.outputs.filter(a=>a.toolCallId===tool.id);
 tool.dataGap=tool.dependencies.some(id=>{const dep=toolsOf(run).find(t=>t.id===id);return dep?.demoEmpty||dep?.dataGap;});
 if(tool.dataGap&&tool.baseId==='TOOL-REPORT'){for(const a of outputs)a.dataGap=true;}
 if(tool.demoEmpty||(tool.dataGap&&tool.baseId!=='TOOL-REPORT')){tool.resultSummary=tool.demoEmpty?'查询成功，返回 0 条记录；未发现不代表不存在。':'缺少必要的上游记录，未生成统计与关系结论。';tool.artifacts=[];return;}
 for(const a of outputs)if(!ss.artifacts.some(x=>x.id===a.id))ss.artifacts.push({...a,pending:false});
 tool.artifacts=outputs.map(a=>a.id);tool.resultSummary=tool.baseId==='TOOL-LINK'?'识别 6 笔待核验交易与 1 条两跳关联路径。':tool.baseId==='TOOL-METRIC'?'收支统计完成：流入 ¥286,400，流出 ¥249,800。':tool.baseId==='TOOL-NET'?'模拟查询成功，返回 1 个第三方支付账号。':tool.baseId==='TOOL-REPORT'?'研判报告已生成，包含来源引用与数据缺口说明。':outputs[0]?.preview||'处理完成，来源引用已保留。';
 const entities=run.graphSeed.entities.filter(e=>e.sourceRefs.some(r=>r.toolCallId===tool.id)),relations=run.graphSeed.relations.filter(r=>r.sourceRefs.some(s=>s.toolCallId===tool.id));
 if(tool.baseId==='TOOL-NET'){
  const ref={queryId:run.query.id,subtaskId:tool.subtaskId,toolCallId:tool.id,artifactId:tool.artifacts[0]};
  entities.push({id:'SS-E-NET',type:'网络账号',name:'微信账号 wx_demo_zhangsan',title:'wx_demo_zhangsan',icon:'net',summary:'微信支付 · 合成主体',state:'Success',properties:{账号:'wx_demo_zhangsan',实名主体:'张三（合成）'},sourceRefs:[ref]});
  relations.push({id:'SS-R-NET',from:'SS-E-001',to:'SS-E-NET',type:'注册',sourceRefs:[ref]});
 }
 if(tool.baseId==='TOOL-LINK'){
  const ref={queryId:run.query.id,subtaskId:tool.subtaskId,toolCallId:tool.id,artifactId:tool.artifacts[0]};
  entities.push({id:'SS-E-006',type:'账户',name:'银行卡 6214 **** 0921',title:'银行卡 6214 **** 0921',icon:'funds',summary:'二跳对手方 · 待核验',state:'Idle',properties:{银行卡号:'6214 **** 0921',核验状态:'待核验'},sourceRefs:[ref]});
  relations.push({id:'SS-R-LINK',from:'SS-E-004',to:'SS-E-006',type:'转账',inferred:true,sourceRefs:[ref]});
 }
 mergeSuperEntities(ss,entities,relations);
}
function advanceRun(ss,run,time){
 let changed=false;const tools=toolsOf(run);
 for(const t of tools)if(t.status==='running'&&t.dueAt<=time){t.status=t.demoFailure?'failed':'done';t.duration=t.simulatedDuration;t.trace.push(t.demoFailure?'模拟请求超时，可重试':'完成处理并写入来源引用');if(t.demoFailure)t.error={code:'DEMO_TIMEOUT',message:'模拟服务超时，请重试。'};else publishResult(ss,run,t);changed=true;}
 for(const t of tools){if(!['pending','dependency_blocked'].includes(t.status)||!t.dependencies.every(id=>tools.find(x=>x.id===id)?.status==='done'))continue;
  const p=run.permissions.find(p=>p.id===t.permissionRequestId||p.relatedToolCallIds.includes(t.id));
  if(p&&p.status!=='approved'){if(p.status==='canceled'){t.status='canceled';continue;}p.status='pending';t.status='waiting_approval';t.error={code:'403_FORBIDDEN',message:'缺少受限来源访问权限。'};if(!ss.ui.selectedPermissions.includes(p.id))ss.ui.selectedPermissions.push(p.id);changed=true;continue;}
  t.status='running';t.dueAt=time+1000;t.duration='执行中';t.trace.push('开始执行本地合成样本');changed=true;
 }
 deriveTask(run);return changed;
}
export function tickSuperSearch(time=Date.now()){
 let changed=false;
 for(const ss of Object.values(state.superSearchSessions||{}))for(const run of ss.queries)if(!['done','failed','paused','waiting_approval'].includes(run.query.status)||toolsOf(run).some(t=>t.status==='running'))changed=advanceRun(ss,run,time)||changed;
 return changed;
}

// Layout belongs to PG05, not a query run or another page's shared session UI.
export function ensureSuperSearchLayout(){
 return state.superSearchLayout ||= {leftCollapsed:false,rightCollapsed:false,historySearch:'',sessionMenuId:null,pinnedSessions:[]};
}
