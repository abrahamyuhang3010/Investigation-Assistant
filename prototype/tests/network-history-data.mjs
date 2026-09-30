import assert from 'node:assert/strict';
import {
  NETWORK_QUERY_ID,
  NETWORK_SESSION_ID,
  createHistoricalNetworkSnapshot,
  createNetworkHistorySession,
  networkCore,
  networkPlanNames,
} from '../src/fixtures/historical-network-case.js';

const ss=createHistoricalNetworkSnapshot(6);
const q=ss.query;
const session=createNetworkHistorySession('org-001');
const visibleActions=ss.agents.flatMap(agent=>agent.toolCalls);
const allActions=[...visibleActions,...q.internalActions];
const actionById=Object.fromEntries(allActions.map(action=>[action.id,action]));
const artifactById=Object.fromEntries(ss.artifacts.map(artifact=>[artifact.id,artifact]));
const entityById=Object.fromEntries(ss.entities.map(entity=>[entity.id,entity]));

assert.equal(ss.fixture,'network-v1');
assert.equal(session.id,NETWORK_SESSION_ID);
assert.equal(session.state,'DONE');
assert.equal(session.stage,'Completed');
assert.equal(session.title,'涉案域名嫌疑终端及窝点研判');
assert.equal(session.listSubtitle,undefined);
assert.equal(q.id,NETWORK_QUERY_ID);
assert.equal(q.status,'done');
assert.equal(q.historical,true);
assert.equal(q.planVersion,1);
assert.equal(q.replanCount,0);
assert.deepEqual(q.previousPlans,[]);
assert.equal(q.subtasks.length,6);
assert.deepEqual(q.subtasks.map(item=>item.name),networkPlanNames);
assert(q.subtasks.every(item=>item.status==='done'&&item.planVersion===1));
assert.equal(q.completedLeafTasks,6);
assert.equal(q.totalLeafTasks,6);

const planSurface=JSON.stringify({intent:q.rewrittenTaskName,subtasks:q.subtasks});
for(const leaked of [
  ...Object.values(networkCore.terminals).map(item=>item.code),
  ...Object.values(networkCore.terminals).map(item=>item.router).filter(Boolean),
  ...networkCore.commonHistoricalIps,
  networkCore.commonRouterIp,
  ...networkCore.commonWifi,
  networkCore.location,
  networkCore.nest,
]) assert(!planSurface.includes(leaked),`Initial Plan leaks ${leaked}`);

assert.equal(visibleActions.length,19);
assert.equal(q.internalActions.length,2);
assert.deepEqual(q.internalActions.map(item=>item.id),['RESULT-AGGREGATOR-001','RESULT-VALIDATOR-001']);
assert.equal(new Set(allActions.map(item=>item.id)).size,21);
assert.equal(q.executionActions.length,21);
assert.equal(q.events.length,21);
for(let index=1;index<q.events.length;index++)assert(q.events[index].at>=q.events[index-1].at,'Historical events must be chronological');
for(const action of allActions){
  assert.equal(action.status,'done',action.id);
  assert.equal(action.planVersion,1,action.id);
  assert(q.subtasks.some(item=>item.id===action.subtaskId),`${action.id} subtask`);
  assert(Date.parse(action.startedAt)<=Date.parse(action.completedAt),`${action.id} timing`);
  for(const dependency of action.dependencies||[]){
    assert(actionById[dependency],`${action.id} dependency ${dependency}`);
    assert(Date.parse(actionById[dependency].completedAt)<=Date.parse(action.startedAt),`${action.id} starts before ${dependency} finishes`);
  }
  for(const artifactId of action.artifacts||[])assert(artifactById[artifactId],`${action.id} artifact ${artifactId}`);
}

const domainAction=actionById['NET-DOMAIN-001'];
assert.equal(domainAction.params.工具,'IP溯源 / 域名溯源 / IP域名反解');
assert.equal(domainAction.params.RPA,'研判终端、虚拟账户等（锋刃）');
assert.equal(domainAction.technical.endpoint,'/xzxt2-center/api/rpa/rpaDz/DMX_15');
assert.equal(domainAction.technical.request_id,'req_net_domain_20260926_102011_1842');
assert.equal(domainAction.technical.status,200);
assert.equal(domainAction.technical.retry_count,0);
assert.equal(domainAction.duration,'17.4s');
for(const id of ['NET-IP-WIFI-001','NET-ROUTER-001','NET-ROUTER-002','NET-IP-WIFI-002','NET-GATEWAY-001','NET-GATEWAY-002']){
  assert.equal(actionById[id].dynamic,true,id);
  assert(actionById[id].generatedBy,id);
}
for(const id of ['NET-DOMAIN-001','TERMINAL-PROFILE-001','TERMINAL-PROFILE-002','TERMINAL-PROFILE-003','NET-IP-WIFI-001','NET-ROUTER-001','NET-ROUTER-002','NET-IP-WIFI-002','NET-GATEWAY-001','NET-GATEWAY-002']){
  assert(!actionById[id].code,`${id} must not fabricate RPA code`);
}
for(const id of ['DOC-NET-001','TERMINAL-RISK-001','ANALYSIS-GEO-001','ANALYSIS-GEO-002','ANALYSIS-NEST-001','ANALYSIS-RELATION-001','REPORT-001'])assert(actionById[id].code,id);

assert.equal(ss.artifacts.length,41);
assert.equal(ss.artifacts.filter(item=>item.sourceType==='user_upload').length,3);
for(const artifact of ss.artifacts){
  assert.equal(artifact.fixture,'network-v1',artifact.id);
  assert(artifact.createdAt,`${artifact.id} generated time`);
  assert(artifact.dataScope,`${artifact.id} data scope`);
  assert(Number.isInteger(artifact.recordCount),`${artifact.id} record count`);
  assert.equal(artifact.generationStatus,'已就绪',artifact.id);
  assert(Array.isArray(artifact.folderPath)&&artifact.folderPath.length,`${artifact.id} folder path`);
  if(artifact.sourceType!=='user_upload'){
    assert(artifact.toolCallId,`${artifact.id} source Action`);
    assert(artifact.subtaskId,`${artifact.id} source Subtask`);
    assert(actionById[artifact.toolCallId],`${artifact.id} action exists`);
    assert.equal(artifact.subtaskId,actionById[artifact.toolCallId].subtaskId,`${artifact.id} lineage`);
  }
}
for(const name of ['域名解析信息.xlsx','域名备案信息.xlsx','访问客户端信息.xlsx'])assert(ss.artifacts.some(item=>item.name.endsWith(name)),name);
const terminalArtifactNames=['登录的微信_QQ信息.xlsx','出口路由信息.xlsx','终端异常软件清单.xlsx','搜索记录清单.xlsx','终端下载文件信息.xlsx','历史IP清单.xlsx','异常终端文件清单.xlsx'];
for(const terminal of ['Terminal-01','Terminal-02','Terminal-03']){
  const items=ss.artifacts.filter(item=>item.folderPath?.[0]==='03 终端画像'&&item.folderPath?.[1]===terminal);
  assert.equal(items.length,7,terminal);
  assert.deepEqual(items.map(item=>item.name),terminalArtifactNames,terminal);
}
for(const name of [
  '历史IP_关联设备.xlsx','历史IP_关联Wi-Fi.xlsx','路由设备关联IP_关联设备.xlsx','路由设备关联IP_关联Wi-Fi.xlsx',
  '路由连接终端信息_Router01.xlsx','路由连接终端信息_Router02.xlsx','网关画像信息_Router01.xlsx','网关画像信息_Router02.xlsx',
  '嫌疑终端筛选结果.xlsx','设备地址聚合结果.xlsx','网络基础设施关系.json','疑似窝点分析.json','涉案域名嫌疑终端及窝点研判报告.pdf',
]) assert(ss.artifacts.some(item=>item.name===name),name);

assert.equal(ss.entities.length,22);
assert.equal(ss.relations.length,27);
for(const entity of ss.entities){
  assert(actionById[entity.discoveredBy],`${entity.id} discovery Action`);
  assert.equal(entity.discoveredInSubtask,actionById[entity.discoveredBy].subtaskId,`${entity.id} discovery Subtask`);
  assert.equal(entity.discoveredAt,actionById[entity.discoveredBy].completedAt,`${entity.id} discovery time`);
  for(const source of entity.sourceRefs||[]){
    assert(actionById[source.toolCallId],`${entity.id} source Action`);
    assert(artifactById[source.artifactId],`${entity.id} source Artifact`);
  }
}
for(const relation of ss.relations){
  assert(entityById[relation.from],`${relation.id} from`);
  assert(entityById[relation.to],`${relation.id} to`);
  assert(actionById[relation.discoveredBy],`${relation.id} discovery Action`);
  assert.equal(relation.discoveredAt,actionById[relation.discoveredBy].completedAt,`${relation.id} discovery time`);
  for(const source of relation.sourceRefs||[]){
    assert(actionById[source.toolCallId],`${relation.id} source Action`);
    assert(artifactById[source.artifactId],`${relation.id} source Artifact`);
  }
}
assert.equal(ss.relations.filter(item=>item.from==='NET-DOMAIN'&&item.type==='域名关联终端').length,3);
assert.equal(ss.entities.filter(item=>item.type==='TERMINAL'&&item.risk==='高').length,2);
for(const ip of networkCore.commonHistoricalIps){
  const id=`NET-IP-H-${ip}`;
  assert(ss.relations.some(item=>item.from==='NET-TERMINAL-01'&&item.to===id),ip);
  assert(ss.relations.some(item=>item.from==='NET-TERMINAL-02'&&item.to===id),ip);
}
const commonRouterId=`NET-IP-R-${networkCore.commonRouterIp}`;
assert(ss.relations.some(item=>item.from==='NET-ROUTER-01'&&item.to===commonRouterId));
assert(ss.relations.some(item=>item.from==='NET-ROUTER-02'&&item.to===commonRouterId));
for(const mac of networkCore.commonWifi){
  const suffix=mac.endsWith('A0')?'A0':'A1';
  const wifiId=`NET-WIFI-${suffix}`;
  assert(ss.relations.some(item=>item.from.startsWith('NET-IP-H-')&&item.to===wifiId),`${mac} history branch`);
  assert(ss.relations.some(item=>item.from===commonRouterId&&item.to===wifiId),`${mac} router branch`);
}
assert.equal(entityById['NET-LOCATION-MYAWADI'].discoveredBy,'NET-GATEWAY-001');
assert.equal(entityById['NET-NEST-A'].discoveredBy,'ANALYSIS-NEST-001');
assert(Date.parse(entityById['NET-TERMINAL-01'].discoveredAt)<Date.parse(entityById['NET-ROUTER-01'].discoveredAt));
assert(Date.parse(entityById['NET-ROUTER-01'].discoveredAt)<Date.parse(entityById['NET-WIFI-C2'].discoveredAt));
assert(Date.parse(entityById['NET-WIFI-A0'].discoveredAt)<Date.parse(entityById['NET-LOCATION-MYAWADI'].discoveredAt));
assert(Date.parse(entityById['NET-LOCATION-MYAWADI'].discoveredAt)<Date.parse(entityById['NET-NEST-A'].discoveredAt));

const geo=artifactById['NET-GEO-RESULT'];
assert.deepEqual(geo.rows[1].slice(0,3),[networkCore.location,5,'2 / 2']);
const nest=JSON.parse(artifactById['NET-NEST-JSON'].content);
assert.equal(nest.suspectedLocation,networkCore.location);
assert.equal(nest.hits,5);
assert.equal(nest.keyTerminalCoverage,'2 / 2');
assert.equal(nest.suspectedPark,networkCore.nest);
assert.equal(nest.parkHits,4);
const report=artifactById['NET-REPORT'];
assert(report.content.includes(q.finalConclusion));
for(const finding of q.findings)assert(report.content.includes(finding),finding);
for(const phrase of ['重点嫌疑终端','较高风险特征','疑似窝点','建议进一步核验'])assert(JSON.stringify(ss).includes(phrase),phrase);
for(const forbidden of ['犯罪终端','诈骗窝点已确认','犯罪人员'])assert(!JSON.stringify(ss).includes(forbidden),forbidden);

console.log(JSON.stringify({
  status:'PASS',session:NETWORK_SESSION_ID,task:NETWORK_QUERY_ID,subtasks:q.subtasks.length,
  visibleActions:visibleActions.length,internalActions:q.internalActions.length,artifacts:ss.artifacts.length,
  entities:ss.entities.length,relations:ss.relations.length,planVersion:q.planVersion,replanCount:q.replanCount,
},null,2));
