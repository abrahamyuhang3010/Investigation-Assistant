import assert from 'node:assert/strict';
import {
  PERSON_QUERY_ID,
  PERSON_SESSION_ID,
  createHistoricalPersonSnapshot,
  createPersonHistorySession,
  personConclusion,
  personCore,
  personPlanNames,
} from '../src/fixtures/historical-person-case.js';

const ss=createHistoricalPersonSnapshot(6);
const q=ss.query;
const session=createPersonHistorySession('org-001');
const actions=ss.agents.flatMap(agent=>agent.toolCalls);
const actionById=Object.fromEntries(actions.map(action=>[action.id,action]));
const artifactById=Object.fromEntries(ss.artifacts.map(artifact=>[artifact.id,artifact]));
const entityById=Object.fromEntries(ss.entities.map(entity=>[entity.id,entity]));

assert.equal(ss.fixture,'person-v1');
assert.equal(session.id,PERSON_SESSION_ID);
assert.equal(session.state,'DONE');
assert.equal(session.stage,'Completed');
assert.equal(session.title,'嫌疑人陈骏近30天活动轨迹及潜藏地研判');
assert.equal(session.listSubtitle,'已完成 · 人员研判');
assert.equal(session.category,'person-investigation');
assert.equal(session.createdAt,'2026-09-24T09:14:22+08:00');
assert.equal(session.completedAt,'2026-09-24T09:19:48+08:00');
assert.equal(q.id,PERSON_QUERY_ID);
assert.equal(q.caseId,'CASE-2026-SZ-0924-041');
assert.equal(q.status,'done');
assert.equal(q.historical,true);
assert.equal(q.planVersion,1);
assert.equal(q.replanCount,0);
assert.deepEqual(q.previousPlans,[]);
assert.deepEqual(q.subtasks.map(item=>item.name),personPlanNames);
assert(q.subtasks.every(item=>item.status==='done'&&item.planVersion===1));
assert.equal(q.completedLeafTasks,6);
assert.equal(q.totalLeafTasks,6);

const planSurface=JSON.stringify({intent:q.rewrittenTaskName,subtasks:q.subtasks});
for(const leaked of [
  ...personCore.phones.map(item=>item.raw),
  ...personCore.phones.map(item=>item.masked),
  ...personCore.devices.map(item=>item.id),
  '星澜智寓','澄湾数字产业园','景澜商务酒店','1207'
]) assert(!planSurface.includes(leaked),`Initial Plan leaks ${leaked}`);

assert.equal(actions.length,14);
assert.deepEqual(q.executionActions,Array.from({length:14},(_,index)=>`ACT-PERSON-${String(index+1).padStart(3,'0')}`));
assert.equal(new Set(actions.map(item=>item.id)).size,14);
for(const id of ['ACT-PERSON-005','ACT-PERSON-006','ACT-PERSON-007','ACT-PERSON-008']){
  assert.equal(actionById[id].dynamic,true,id);
  assert.equal(actionById[id].generatedBy,'ACT-PERSON-004',id);
  assert.deepEqual(actionById[id].dependencies,['ACT-PERSON-004'],id);
}
assert.deepEqual(ss.agents.find(agent=>agent.id==='information-retrieval-agent').toolCalls.map(item=>item.id),[
  'ACT-PERSON-003','ACT-PERSON-004','ACT-PERSON-005','ACT-PERSON-006','ACT-PERSON-007','ACT-PERSON-008'
]);
assert.deepEqual(ss.agents.find(agent=>agent.id==='data-analysis-agent').toolCalls.map(item=>item.id),[
  'ACT-PERSON-001','ACT-PERSON-002','ACT-PERSON-009','ACT-PERSON-010','ACT-PERSON-011','ACT-PERSON-012','ACT-PERSON-013','ACT-PERSON-014'
]);
for(const action of actions){
  assert.equal(action.status,'done',action.id);
  assert.equal(action.planVersion,1,action.id);
  assert(q.subtasks.some(item=>item.id===action.subtaskId),`${action.id} subtask`);
  assert(Date.parse(action.startedAt)<=Date.parse(action.completedAt),`${action.id} timing`);
  for(const dependency of action.dependencies||[]){
    assert(actionById[dependency],`${action.id} dependency ${dependency}`);
    assert(Date.parse(actionById[dependency].completedAt)<=Date.parse(action.startedAt),`${action.id} starts before ${dependency} finishes`);
  }
  for(const artifactId of action.artifacts||[])assert(artifactById[artifactId],`${action.id} artifact ${artifactId}`);
  assert.equal(action.technical.mock,true,`${action.id} must disclose Mock execution`);
}

assert.deepEqual([
  actionById['ACT-PERSON-003'].technical.object_id,
  actionById['ACT-PERSON-004'].technical.object_id,
  actionById['ACT-PERSON-005'].technical.object_id,
  actionById['ACT-PERSON-006'].technical.object_id,
  actionById['ACT-PERSON-007'].technical.object_id,
  actionById['ACT-PERSON-008'].technical.object_id,
],[
  'obj_yunsou_001','obj_buxingzhuan_001','obj_yunjing_phone_176_001',
  'obj_yunjing_phone_189_001','obj_meituan_176_001','obj_meituan_189_001'
]);

assert.equal(ss.artifacts.length,15);
assert.equal(ss.artifacts.filter(item=>item.sourceType==='user_upload').length,2);
for(const artifact of ss.artifacts){
  assert.equal(artifact.fixture,'person-v1',artifact.id);
  assert.equal(artifact.queryId,PERSON_QUERY_ID,artifact.id);
  assert(artifact.createdAt,`${artifact.id} createdAt`);
  assert(artifact.dataScope,`${artifact.id} dataScope`);
  assert(Number.isInteger(artifact.recordCount),`${artifact.id} recordCount`);
  assert.equal(artifact.generationStatus,'已就绪',artifact.id);
  assert(artifact.validationSummary,`${artifact.id} validationSummary`);
  assert(Array.isArray(artifact.folderPath)&&artifact.folderPath[0]===PERSON_QUERY_ID,`${artifact.id} folderPath`);
  if(artifact.sourceType!=='user_upload'){
    assert(artifact.subtaskId,`${artifact.id} subtaskId`);
    assert(artifact.toolCallId,`${artifact.id} toolCallId`);
    assert(actionById[artifact.toolCallId],`${artifact.id} action`);
  }
}
assert.equal(artifactById['ART-PERSON-EXTRACTED'].recordCount,47);
assert.equal(artifactById['ART-PERSON-NORMALIZED'].recordCount,9);
const frequencyRows=artifactById['ART-PERSON-FREQUENCY'].rows;
assert.deepEqual(frequencyRows.find(item=>String(item[0]).includes('星澜智寓')).slice(1,3),[20,9]);
assert.equal(frequencyRows.find(item=>String(item[0]).includes('澄湾数字产业园'))[1],11);
assert.equal(frequencyRows.find(item=>String(item[0]).includes('景澜商务酒店'))[1],2);

assert.equal(ss.entities.length,13);
assert.equal(ss.relations.length,17);
for(const entity of ss.entities){
  assert(Array.isArray(entity.sourceRefs)&&entity.sourceRefs.length,`${entity.id} sourceRefs`);
  for(const source of entity.sourceRefs){
    assert(actionById[source.toolCallId],`${entity.id} action ref ${source.toolCallId}`);
    assert(artifactById[source.artifactId],`${entity.id} artifact ref ${source.artifactId}`);
  }
}
for(const relation of ss.relations){
  assert(entityById[relation.from],`${relation.id} from`);
  assert(entityById[relation.to],`${relation.id} to`);
  assert(Array.isArray(relation.sourceRefs)&&relation.sourceRefs.length,`${relation.id} sourceRefs`);
  for(const source of relation.sourceRefs){
    assert(actionById[source.toolCallId],`${relation.id} action ref ${source.toolCallId}`);
    assert(artifactById[source.artifactId],`${relation.id} artifact ref ${source.artifactId}`);
  }
}
const hideout=ss.relations.find(item=>item.id==='PERSON-R-HIDEOUT');
assert.equal(hideout.inferred,true);
assert.equal(hideout.type,'疑似落脚关系');
assert.match(JSON.stringify(hideout),/第一潜藏地候选/);
assert.match(JSON.stringify(hideout),/尚未确认/);

for(let index=1;index<q.events.length;index++)assert(q.events[index].at>=q.events[index-1].at,'Historical events must be chronological');
const eventOrder=q.events.map(item=>item.type);
for(const sequence of [
  ['ACT-PERSON-004','phone_discovered_176','dynamic_actions_created','ACT-PERSON-005','device_discovered'],
  ['ACT-PERSON-007','precise_location_discovered','ACT-PERSON-009','ACT-PERSON-010','ACT-PERSON-011','ACT-PERSON-012','ACT-PERSON-013','ACT-PERSON-014','task_done']
]){
  let previous=-1;
  for(const type of sequence){const current=eventOrder.indexOf(type);assert(current>previous,`${type} discovery order`);previous=current;}
}
assert.deepEqual(q.discoveries.slice(0,2).map(item=>item.discoveredBy),['ACT-PERSON-004','ACT-PERSON-004']);
assert.deepEqual(q.discoveries.slice(2,4).map(item=>item.discoveredBy),['ACT-PERSON-005','ACT-PERSON-005']);
assert.equal(q.discoveries.find(item=>item.id==='PERSON-D-005').refinedBy,'ACT-PERSON-007');
assert.equal(q.discoveries.at(-1).discoveredBy,'ACT-PERSON-013');

for(const phrase of ['疑似','候选','重点核验','更符合'])assert(personConclusion.includes(phrase),phrase);
for(const forbidden of ['已确认居住地','已确认潜藏地','现住星澜智寓','确认藏匿'])assert(!personConclusion.includes(forbidden),forbidden);
const reusableSurface=JSON.stringify({actions,entities:ss.entities,relations:ss.relations});
assert(!reusableSurface.includes(personCore.idNumber),'Reusable surfaces must mask the ID number');
for(const phone of personCore.phones){
  assert(reusableSurface.includes(phone.masked),`Masked phone ${phone.masked}`);
}
assert.match(entityById['PHONE-176'].name,/176\*{4}4182/);
assert.match(entityById['PHONE-189'].name,/189\*{4}6731/);
assert.match(ss.followupMessage,/前端|Demo/);
assert.match(ss.followupMessage,/没有新增手机号、设备、位置、Artifact 或研判结论/);

console.log(JSON.stringify({
  status:'PASS',session:PERSON_SESSION_ID,query:PERSON_QUERY_ID,subtasks:q.subtasks.length,
  actions:actions.length,artifacts:ss.artifacts.length,entities:ss.entities.length,relations:ss.relations.length,
  events:q.events.length,discoveries:q.discoveries.length
},null,2));
