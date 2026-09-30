import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHistoricalFundSnapshot,fundTransactions,fundMetrics,fundAccounts} from '../src/fixtures/historical-fund-case.js';
const ss=createHistoricalFundSnapshot(5),q=ss.query,actions=ss.agents.flatMap(a=>a.toolCalls),byId=Object.fromEntries(actions.map(a=>[a.id,a]));
assert.equal(q.status,'done');assert.equal(q.planVersion,1);assert.equal(q.previousPlans.length,0);assert.equal(q.subtasks.length,5);
assert(!/周凯|林泽宇|刘倩|梁嘉豪|蒋文浩|马思远|何俊峰|财付通/.test(JSON.stringify(q.subtasks)+q.rewrittenTaskName));
assert.deepEqual(fundTransactions.slice(0,10).map(t=>t.amountCents/100),[50000,30000,30000,25000,20000,5000,27500,24600,20000,19600]);
assert.equal(fundMetrics.inflowCents,8000000);assert.equal(fundMetrics.rapidOutflowCents,7500000);assert.equal(fundMetrics.rapidRatio,93.75);
assert.equal(new Set(actions.map(a=>a.id)).size,actions.length);
for(const a of actions){
 assert.equal(a.status,'done');assert(!a.dueAt);assert(q.subtasks.some(st=>st.id===a.subtaskId));
 assert(Date.parse(a.startedAt)<Date.parse(a.completedAt),a.id);
 for(const d of a.dependencies)assert(Date.parse(byId[d].completedAt)<=Date.parse(a.startedAt),`${a.id} depends on ${d}`);
 for(const id of a.artifacts)assert(ss.artifacts.some(f=>f.id===id),`${a.id} file ${id}`);
 if(a.id.startsWith('RPA-'))assert(!a.code,'No fabricated RPA code');
}
for(let i=1;i<q.events.length;i++)assert(q.events[i].at>=q.events[i-1].at,'Event order');
assert.equal(byId['RPA-PAY-002'].generatedBy,'RPA-BANK-003');
for(const e of ss.entities){assert(byId[e.discoveredBy]);assert.equal(e.discoveredInSubtask,byId[e.discoveredBy].subtaskId);assert.equal(e.discoveredAt,byId[e.discoveredBy].completedAt);}
for(const r of ss.relations){assert(ss.entities.some(e=>e.id===r.from));assert(ss.entities.some(e=>e.id===r.to));for(const ref of r.sourceRefs)assert(ss.artifacts.some(a=>a.id===ref.artifactId));}
for(const t of fundTransactions){const r=ss.relations.find(r=>r.id===`FUND-R-${t.id}`);assert.equal(r.amountCents,t.amountCents);assert.equal(r.transactionId,t.transactionId);}
for(const a of ss.artifacts){
 assert(a.createdAt&&a.dataScope&&a.generationStatus&&a.recordCount);
 if(a.toolCallId){assert(byId[a.toolCallId]);assert.equal(a.subtaskId,byId[a.toolCallId].subtaskId);}
 if(a.downloadUrl){const bytes=fs.readFileSync(new URL('../'+a.downloadUrl.replace(/^\//,''),import.meta.url));assert(bytes.length>0);if(a.type==='PDF')assert.equal(bytes.subarray(0,5).toString(),'%PDF-');if(a.type==='PNG')assert.equal(bytes.subarray(1,4).toString(),'PNG');if(a.type==='PARQUET')assert.equal(bytes.subarray(0,4).toString(),'PAR1');}
}
const zhou=ss.artifacts.find(a=>a.id==='FUND-FLOW-zhou');assert.equal(zhou.sourceRecordCount,8214);assert.equal(zhou.recordCount,6);assert.equal(zhou.rows.length,7);
const report=ss.artifacts.find(a=>a.id==='FUND-REPORT');assert(report.content.includes(q.finalConclusion));for(const finding of q.findings)assert(report.content.includes(finding));
for(const amount of ['50,000','30,000','25,000','20,000','5,000','27,500','24,600','19,600','75,000','93.75%'])assert(report.content.includes(amount),amount);
for(const t of fundTransactions){
 const result=byId[t.discoveredBy].resultSummary;
 assert(result.includes('¥'+(t.amountCents/100).toLocaleString('en-US')),`Action amount ${t.id}`);
 const rows=ss.artifacts.filter(a=>a.type==='XLSX').flatMap(a=>a.rows.slice(1)).filter(row=>row[0]===t.id);
 assert(rows.length>0,`XLSX transaction ${t.id}`);
 for(const row of rows){assert.equal(row[6],t.amountCents/100);assert.equal(row[1],t.time);assert.equal(row[3],fundAccounts[t.from].masked);assert.equal(row[5],fundAccounts[t.to].masked);}
 if(fundTransactions.indexOf(t)<10)assert(report.content.includes(t.transactionId||'原附件未提供流水号'));
}
assert.deepEqual(byId['ANALYSIS-001'].metrics,fundMetrics);
const graph=JSON.parse(ss.artifacts.find(a=>a.id==='FUND-GRAPH').content);assert.deepEqual(graph.relations,ss.relations);assert.deepEqual(graph.metrics,fundMetrics);
// No full simulated accounts in user-facing content, preview rows, JSON, graph or conclusions.
const surfaces=JSON.stringify(ss);for(const a of Object.values(fundAccounts).filter(a=>a.number))assert(!surfaces.includes(a.number),`Unmasked account: ${a.id}`);
console.log(JSON.stringify({status:'PASS',subtasks:5,actions:actions.length,files:ss.artifacts.length,entities:ss.entities.length,relations:ss.relations.length,metrics:fundMetrics},null,2));
