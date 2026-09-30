import {esc} from './ui.js';

export const CASE_WORKBENCHES=[
  {key:'case',label:'因案研判',route:'PG12',routes:['PG12','PG13'],description:'从案件资料出发，关联线索、自动研判并形成报告。'},
  {key:'event',label:'因事研判',route:'PG14',routes:['PG14','PG15','PG16'],description:'围绕重点事件与线索创建研判任务，组织实体采集、关系分析与成果沉淀。'},
  {key:'serial',label:'案件串并',route:'PG17',routes:['PG17'],description:'基于授权案件与可核验依据发现关联候选，人工核验后形成串并意见。'},
  {key:'clues',label:'价值线索库',route:'PG35',routes:['PG35'],description:'汇聚研判过程中沉淀的高价值实体与关系线索，支持按来源回查、核验与复用。'},
];

export function caseWorkbenchForRoute(route){
  return CASE_WORKBENCHES.find(item=>item.routes.includes(route))||CASE_WORKBENCHES[0];
}

export function caseWorkbenchAsset(key,muted=false,cls=''){
  return `<img class="case-workbench-icon ${cls}" src="/assets/case-workbenches/${key}${muted?'-muted':''}.svg" alt="">`;
}

export function caseWorkbenchHeading(key,actions=''){
  const item=CASE_WORKBENCHES.find(entry=>entry.key===key)||CASE_WORKBENCHES[0];
  return `<div class="case-page-heading case-workbench-heading"><div><div class="case-workbench-title">${caseWorkbenchAsset(item.key)}<h1>${esc(item.label)}</h1></div><p>${esc(item.description)}</p></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
}
