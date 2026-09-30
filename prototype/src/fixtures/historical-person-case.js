/**
 * Completed person-investigation history fixture.
 * All names, identifiers, locations and external-source results are deterministic
 * synthetic demo data. The initial Plan intentionally excludes every object that
 * is discovered only after tool execution.
 */
export const PERSON_SESSION_ID='SS-PERSON-20260924-0017';
export const PERSON_QUERY_ID='TASK-PERSON-20260924-0017';
const INFO='information-retrieval-agent';
const ANALYSIS='data-analysis-agent';
export const personNotice='全部为虚构模拟数据，仅用于 Demo；外部调证均为前端 Mock，分析结论为待人工核验线索。';

export const personPlanNames=[
 '确认目标人员及身份标识',
 '建立目标人员统一档案',
 '获取目标人员多源设备与生活轨迹',
 '提取并统一多源地址数据',
 '重建活动轨迹并识别高频区域',
 '潜藏地推断与最终报告'
];

export const personOriginalQuery='请研判嫌疑人陈骏（身份证号 320599199308160018）近 30 天的活动轨迹，结合个人档案、手机号设备位置、铁路/民航/住宿、外卖等多源信息，判断其近期主要活动区域和可能的落脚点，并给出可追溯的证据。';
export const personIntent='围绕目标人员陈骏建立统一人员视图，结合个人档案、手机号设备位置、住宿、铁路、外卖等多源轨迹，重建近30天活动时间线，识别高频和近期活动区域，并综合多源一致性推断可能的近期落脚点。';

export const personCore={
 name:'陈骏',
 idNumber:'320599199308160018',
 maskedIdNumber:'320599********0018',
 account:'cj_0816',
 phones:[
  {raw:'17600004182',masked:'176****4182'},
  {raw:'18900006731',masked:'189****6731'}
 ],
 devices:[
  {id:'DVC-7F3C9A21',role:'主设备',strength:'高'},
  {id:'DVC-192E0B63',role:'次设备',strength:'中'}
 ],
 eventCount:47,
 normalizedLocationCount:9,
 xinglanEvents:20,
 xinglanContinuousDays:9,
 chengwanEvents:11,
 hotelEvents:2,
 primaryCandidate:'星澜智寓3栋附近',
 preciseAddress:'3栋1207',
 secondaryArea:'澄湾数字产业园B2座附近'
};

export const personConclusion=`综合个人档案、手机号可信关系、设备位置和外卖生活轨迹，目标人员陈骏近30天活动重心已由昆山、南京零散活动转移至苏州市工业园区，近期疑似主要活动于该区域。\n\n9月14日其通过铁路进入苏州园区，并短暂入住景澜商务酒店。9月16日起，其关联主设备及两个可信手机号的生活轨迹持续指向星澜智寓和澄湾数字产业园两个区域。\n\n其中，星澜智寓3栋附近连续多日出现夜间设备位置、晚间外卖和次日清晨设备记录，呈现明显居住型活动特征；澄湾数字产业园B2座附近主要集中于白天和午间，更符合工作、办事或固定活动区域特征。\n\n综合出现频次、最近性、多源交叉和昼夜分布，星澜智寓3栋附近可作为当前第一潜藏地候选，其中1207室为重点核验地址；澄湾数字产业园B2座附近为第二重点活动区域。以上均为模拟研判线索，需结合现场与授权数据人工核验。`;

export const personFindings=[
 '部刑专个人档案动态发现 2 个可信手机号：176****4182、189****6731。',
 '两个手机号均关联主设备 DVC-7F3C9A21，增强人员—手机号—设备的一致性。',
 '近30天多源数据共提取47条地址 / 位置事件，归并为9个地点实体。',
 '9月14日目标由南京南乘车到达苏州园区，当晚短暂入住景澜商务酒店。',
 '9月16日起，设备位置和外卖记录持续指向星澜智寓3栋和澄湾数字产业园B2座。',
 '星澜智寓3栋附近形成20条高相关位置事件，连续出现9天，最近记录为9月24日08:16。',
 '澄湾数字产业园B2座附近形成11条事件，日间占比高，更符合工作或固定办事活动区域。',
 '综合频次、最近性和多源交叉，星澜智寓3栋附近为第一潜藏地候选，1207室为重点核验地址。'
];

export const personTimeline=[
 ['2026-09-14 16:21','铁路出行','南京南 → 苏州园区','云搜'],
 ['2026-09-14 18:06','铁路到达','苏州园区站','云搜'],
 ['2026-09-14 20:41','住宿','景澜商务酒店','云搜'],
 ['2026-09-15 11:03','住宿离店','景澜商务酒店','云搜'],
 ['2026-09-16 21:07','外卖','星澜智寓3栋1207','美团'],
 ['2026-09-16 22:48','设备位置','星澜智寓附近','云镜'],
 ['2026-09-17 07:11','设备位置','星澜智寓附近','云镜'],
 ['2026-09-17 10:06','设备位置','澄湾数字产业园','云镜'],
 ['2026-09-17 20:42','外卖','星澜智寓3栋1207','美团'],
 ['2026-09-17 23:16','设备位置','星澜智寓附近','云镜'],
 ['2026-09-18 08:01','设备位置','星澜智寓附近','云镜'],
 ['2026-09-18 10:21','设备位置','澄湾数字产业园','云镜'],
 ['2026-09-18 12:13','外卖','澄湾数字产业园B2座','美团'],
 ['2026-09-18 21:36','外卖','星澜智寓3栋1207','美团'],
 ['2026-09-18 23:07','设备位置','星澜智寓附近','云镜'],
 ['2026-09-20 22:04','外卖','星澜智寓3栋1207','美团'],
 ['2026-09-21 09:58','设备位置','澄湾数字产业园','云镜'],
 ['2026-09-21 22:37','设备位置','星澜智寓附近','云镜'],
 ['2026-09-22 12:26','外卖','澄湾数字产业园B2座','美团'],
 ['2026-09-22 23:19','设备位置','星澜智寓附近','云镜'],
 ['2026-09-23 20:51','外卖','星澜智寓3栋1207','美团'],
 ['2026-09-23 22:14','设备位置','星澜智寓附近','云镜'],
 ['2026-09-24 07:43','设备位置','星澜智寓附近','云镜'],
 ['2026-09-24 08:16','外卖','星澜智寓3栋1207','美团']
];

export function createPersonHistorySession(org){
 return {
  id:PERSON_SESSION_ID,
  sessionId:PERSON_SESSION_ID,
  title:'嫌疑人陈骏近30天活动轨迹及潜藏地研判',
  listSubtitle:'已完成 · 人员研判',
  org,
  caseId:'CASE-2026-SZ-0924-041',
  projectName:'苏州电信网络诈骗案 · 人员落地研判',
  type:'人员研判',
  category:'person-investigation',
  state:'DONE',
  stage:'Completed',
  step:6,
  attempt:1,
  planVersion:1,
  replanCount:0,
  seq:0,
  draft:'',
  createdAt:'2026-09-24T09:14:22+08:00',
  completedAt:'2026-09-24T09:19:48+08:00',
  updated:'2026-09-24 09:19:48',
  archived:false,
  question:personOriginalQuery,
  steps:personPlanNames.map((name,index)=>({id:`PERSON-ST-0${index+1}`,name,status:'DONE'})),
  messages:[],
  events:[],
  historicalFixture:'person-v1'
 };
}

const started=(time,seconds=4)=>{
 const d=new Date(time);d.setSeconds(d.getSeconds()-seconds);return d.toISOString();
};
const ref=(toolCallId,artifactId,subtaskId)=>({queryId:PERSON_QUERY_ID,subtaskId,toolCallId,artifactId});

export function createHistoricalPersonSnapshot(version){
 const subtasks=personPlanNames.map((name,index)=>({
  id:`PERSON-ST-0${index+1}`,
  index:String(index+1).padStart(2,'0'),
  name,
  status:'done',
  planVersion:1
 }));
 const artifacts=[];
 const actions=[];
 const entities=[];
 const relations=[];

 function file(id,name,type,sourceType,subtaskId,toolCallId,folder,createdAt,options={}){
  const artifact={
   id:`ART-PERSON-${id}`,
   name,
   type,
   size:options.size||'12.0 KB',
   sourceType,
   queryId:PERSON_QUERY_ID,
   subtaskId,
   agentId:options.agentId||ANALYSIS,
   toolCallId:toolCallId||null,
   createdAt,
   dataScope:options.dataScope||'2026-08-26 至 2026-09-24',
   recordCount:Number.isInteger(options.recordCount)?options.recordCount:0,
   sourceRecordCount:options.sourceRecordCount,
   generationStatus:'已就绪',
   validationSummary:options.validationSummary||personNotice,
   fixture:'person-v1',
   folderPath:[PERSON_QUERY_ID,folder],
   preview:options.preview||'',
   content:options.content,
   rows:options.rows,
   records:options.records
  };
  artifacts.push(artifact);
  return artifact;
 }

 const uploadNote=file('UPLOAD-NOTE','案件笔录_20260924.pdf','PDF','user_upload','PERSON-ST-01',null,'用户上传的文件','2026-09-24T09:14:22+08:00',{
  size:'1.8 MB',recordCount:8,dataScope:'案件材料 · 8页',agentId:null,
  content:'模拟案件笔录\n目标人员：陈骏\n模拟身份证号：320599********0018\n过往网络账号：cj_0816\n当前材料未直接给出现用手机号、设备号、现住址或近期活动地址。',
  validationSummary:'用户上传的虚构模拟案件材料，未连接真实案件系统。'
 });
 const uploadBase=file('UPLOAD-BASE','嫌疑人基础信息表.xlsx','XLSX','user_upload','PERSON-ST-01',null,'用户上传的文件','2026-09-24T09:14:22+08:00',{
  size:'18.6 KB',recordCount:1,dataScope:'目标人员基础信息',agentId:null,
  rows:[['姓名','身份证号','网络账号','户籍线索'],['陈骏','320599********0018','cj_0816','江苏省苏州市昆山市']],
  validationSummary:'用户上传的虚构模拟基础信息表。'
 });
 const noteText=file('CASE-TEXT','case_note_20260924.txt','TXT','analysis_output','PERSON-ST-01','ACT-PERSON-001','00 案件材料解析','2026-09-24T09:14:31+08:00',{
  size:'9.2 KB',recordCount:8,dataScope:'案件笔录8页文本',preview:'已提取8页文本',content:'案件材料文本提取结果\n目标人员：陈骏\n身份证号：320599********0018\n网络账号：cj_0816\n现用手机号：未确认\n'+personNotice
 });
 const yunsou=file('YUNSOU','yunsou_person_archive.xlsx','XLSX','tool_output','PERSON-ST-02','ACT-PERSON-003','01 人员统一档案','2026-09-24T09:15:03+08:00',{
  size:'42.8 KB',recordCount:23,agentId:INFO,dataScope:'人员电子档案 / 铁路 / 民航 / 住宿 / 全部轨迹等8类',
  rows:[['类别','时间','内容','来源对象'],['人员基础','—','陈骏 · 户籍地苏州市昆山市玉峰片区','obj_yunsou_001'],['铁路','2026-09-14 16:21','南京南 → 苏州园区 · G71XX','obj_yunsou_001'],['住宿','2026-09-14 20:41','景澜商务酒店 · 09-15 11:03离店','obj_yunsou_001'],['轨迹摘要','2026-09-14 后','苏州工业园区活动增多','obj_yunsou_001']]
 });
 const buxing=file('BUXING','buxingzhuan_person_archive.xlsx','XLSX','tool_output','PERSON-ST-02','ACT-PERSON-004','01 人员统一档案','2026-09-24T09:15:11+08:00',{
  size:'36.4 KB',recordCount:16,agentId:INFO,dataScope:'人基础信息 / 身份证-手机可信库 / 手机注册信息等',
  rows:[['类别','标识','可信来源','最近出现'],['身份证-手机可信库','176****4182','身份证-手机可信库','2026-09-23'],['手机注册信息','189****6731','手机注册信息 + 历史可信关系','2026-09-21']]
 });
 const yj176=file('YJ-176','yunjing_17600004182.xlsx','XLSX','tool_output','PERSON-ST-03','ACT-PERSON-005','02 手机号与设备','2026-09-24T09:16:02+08:00',{
  size:'58.2 KB',recordCount:28,agentId:INFO,dataScope:'176****4182 · 2026-08-26 至 2026-09-24',
  rows:[['手机号','设备','关系强度','时间','候选位置'],['176****4182','DVC-7F3C9A21','高','2026-09-24 07:43','星澜智寓附近'],['176****4182','DVC-192E0B63','中','2026-09-19 14:18','澄湾数字产业园附近'],['176****4182','DVC-7F3C9A21','高','2026-09-18 10:21','澄湾数字产业园附近']]
 });
 const yj189=file('YJ-189','yunjing_18900006731.xlsx','XLSX','tool_output','PERSON-ST-03','ACT-PERSON-006','02 手机号与设备','2026-09-24T09:16:08+08:00',{
  size:'31.9 KB',recordCount:9,agentId:INFO,dataScope:'189****6731 · 2026-08-26 至 2026-09-24',
  rows:[['手机号','设备','关系强度','位置记录'],['189****6731','DVC-7F3C9A21','高','9']]
 });
 const mt176=file('MT-176','meituan_17600004182.xlsx','XLSX','tool_output','PERSON-ST-03','ACT-PERSON-007','03 生活轨迹','2026-09-24T09:16:19+08:00',{
  size:'26.1 KB',recordCount:8,agentId:INFO,dataScope:'176****4182 · 2026-08-26 至 2026-09-24',
  rows:[['时间','手机号','收货人','收货地址'],['2026-09-16 21:07','176****4182','陈先生','苏州市工业园区星澜智寓3栋1207室'],['2026-09-18 12:13','176****4182','陈先生','苏州市工业园区澄湾数字产业园B2座北门'],['2026-09-18 21:36','176****4182','陈先生','苏州市工业园区星澜智寓3-1207'],['2026-09-20 22:04','176****4182','陈先生','苏州市工业园区星澜智寓三栋1207'],['2026-09-24 08:16','176****4182','陈先生','苏州市工业园区星澜智寓3栋1207']]
 });
 const mt189=file('MT-189','meituan_18900006731.xlsx','XLSX','tool_output','PERSON-ST-03','ACT-PERSON-008','03 生活轨迹','2026-09-24T09:16:25+08:00',{
  size:'18.4 KB',recordCount:3,agentId:INFO,dataScope:'189****6731 · 2026-08-26 至 2026-09-24',
  rows:[['时间','手机号','收货地址'],['2026-09-19 20:18','189****6731','星澜智寓3栋'],['2026-09-22 12:26','189****6731','澄湾数字产业园B2座'],['2026-09-23 20:51','189****6731','星澜智寓3栋1207室']]
 });
 const extracted=file('EXTRACTED','extracted_locations.json','JSON','analysis_output','PERSON-ST-04','ACT-PERSON-009','04 地址提取与归一','2026-09-24T09:17:03+08:00',{
  size:'34.7 KB',recordCount:47,dataScope:'6份多源调证文档 · 47条地址/位置事件',
  records:[{type:'户籍地址',count:1},{type:'铁路出发/到达',count:4},{type:'住宿地址',count:3},{type:'设备位置',count:31},{type:'外卖收货地址',count:8}],
  content:JSON.stringify({total:47,types:{户籍地址:1,'铁路出发/到达':4,住宿地址:3,设备位置:31,外卖收货地址:8},notice:personNotice},null,2)
 });
 const normalized=file('NORMALIZED','normalized_locations.json','JSON','analysis_output','PERSON-ST-04','ACT-PERSON-010','04 地址提取与归一','2026-09-24T09:17:31+08:00',{
  size:'21.6 KB',recordCount:9,dataScope:'47条事件 → 9个地点实体',
  records:[
   {id:'LOC-001',canonical_name:'苏州市工业园区星澜智寓3栋',aliases:['星澜智寓附近','星澜智寓3栋1207','星澜智寓3-1207','星澜智寓三栋1207']},
   {id:'LOC-002',canonical_name:'苏州市工业园区澄湾数字产业园B2座',aliases:['澄湾数字产业园附近','澄湾数字产业园B2座','澄湾数字产业园B2座北门']},
   {id:'LOC-003',canonical_name:'苏州市工业园区景澜商务酒店',aliases:['景澜商务酒店']},
   {id:'LOC-004',canonical_name:'苏州市昆山市玉峰片区户籍地址',aliases:['昆山户籍地']}
  ],
  content:JSON.stringify({source_events:47,normalized_locations:9,primary_entities:['LOC-001','LOC-002','LOC-003','LOC-004'],notice:personNotice},null,2)
 });
 const timeline=file('TIMELINE','person_timeline.csv','CSV','analysis_output','PERSON-ST-05','ACT-PERSON-011','05 轨迹与活动分析','2026-09-24T09:18:14+08:00',{
  size:'16.3 KB',recordCount:47,dataScope:'近30天活动时间线',rows:[['时间','事件类型','地点','来源'],...personTimeline]
 });
 const frequency=file('FREQUENCY','location_frequency.csv','CSV','analysis_output','PERSON-ST-05','ACT-PERSON-012','05 轨迹与活动分析','2026-09-24T09:18:43+08:00',{
  size:'8.9 KB',recordCount:9,dataScope:'9个归一地点的频次 / 最近性 / 昼夜分布',
  rows:[['地点','事件数','连续天数','主要时段','最近出现','研判类型'],['星澜智寓3栋',20,9,'夜间 / 清晨','2026-09-24 08:16','居住型高频区域'],['澄湾数字产业园B2座',11,'—','日间 / 午间','2026-09-23 17:42','工作型高频区域'],['景澜商务酒店',2,1,'过渡住宿','2026-09-15 11:03','过渡型地点']]
 });
 const reasoning=file('REASONING','hideout_reasoning.md','MD','analysis_output','PERSON-ST-06','ACT-PERSON-013','05 轨迹与活动分析','2026-09-24T09:19:16+08:00',{
  size:'7.6 KB',recordCount:3,dataScope:'星澜智寓 / 澄湾数字产业园 / 景澜商务酒店证据矩阵',
  content:`# 潜藏地推理（模拟）\n\n| 证据 | 星澜智寓 | 澄湾产业园 | 景澜酒店 |\n|---|---|---|---|\n| 高频出现 | 高 | 中高 | 低 |\n| 最近出现 | 极近 | 近 | 较早 |\n| 夜间出现 | 高 | 低 | 一次 |\n| 清晨出现 | 高 | 低 | 无 |\n| 生活行为 | 高 | 中 | 无 |\n| 设备位置 | 高 | 高 | 无 |\n| 多手机号交叉 | 是 | 是 | 否 |\n| 连续多日 | 是 | 是 | 否 |\n| 地址类型 | 居住型 | 工作型 | 过渡住宿 |\n\n第一潜藏地候选：星澜智寓3栋附近；1207室为重点核验地址。\n第二重点区域：澄湾数字产业园B2座附近，更符合白天工作、办事或固定活动地点。\n\n${personNotice}`
 });
 const report=file('REPORT','陈骏_人员研判报告.md','MD','final_output','PERSON-ST-06','ACT-PERSON-014','06 最终报告','2026-09-24T09:19:48+08:00',{
  size:'18.8 KB',recordCount:47,dataScope:'TASK-PERSON-20260924-0017 最终历史快照',
  content:`# 陈骏人员研判报告（模拟）\n\n## 01 案件及研判目标\n${personOriginalQuery}\n\n## 02 人员统一身份视图\n陈骏，模拟身份证号 ${personCore.maskedIdNumber}，网络账号 ${personCore.account}。\n\n## 03 多源调证结果\n云搜、部刑专、云镜、美团均为前端 Mock 数据，形成可追溯 Artifact。\n\n## 04 手机号与设备关联\n可信手机号2个，关联设备2个，主设备 DVC-7F3C9A21。\n\n## 05 近30天活动轨迹\n9月14日南京南进入苏州园区，景澜商务酒店为过渡住宿；9月16日起形成星澜智寓与澄湾数字产业园双中心。\n\n## 06 高频活动区域\n星澜智寓20条事件、连续9天；澄湾数字产业园11条事件；景澜商务酒店2条事件。\n\n## 07 近期活动模式\n星澜智寓呈夜间/清晨生活型特征；澄湾数字产业园呈日间/午间工作型特征。\n\n## 08 潜藏地推断\n${personConclusion}\n\n## 09 证据链\nFinal Conclusion → hideout_reasoning.md → location_frequency.csv → person_timeline.csv → normalized_locations.json → extracted_locations.json → 云镜/美团/云搜/部刑专 Artifact。\n\n## 10 建议核验事项\n1. 对星澜智寓3栋1207室开展进一步身份与实际居住情况核验。\n2. 对澄湾数字产业园B2座相关门禁、人员登记或现场活动情况进行人工核查。\n3. 持续关注 DVC-7F3C9A21 的最新位置变化。\n\n${personNotice}`
 });

 function action(id,toolName,subtaskId,agentId,completedAt,duration,params,resultSummary,artifactIds=[],options={}){
  const value={
   id,toolId:id,toolName,subtaskId,agentId,queryId:PERSON_QUERY_ID,status:'done',duration,
   startedAt:options.startedAt||started(completedAt,options.startOffset||4),completedAt,
   planVersion:1,attempt:1,dynamic:!!options.dynamic,generatedBy:options.generatedBy||null,
   params,trace:options.trace||['读取已授权的虚构模拟输入','执行确定性前端 Mock','写入 Workspace 并保留来源引用'],
   resultSummary,artifacts:artifactIds,outputIds:options.outputIds||artifactIds,
   dependencies:options.dependencies||[],technical:{object_id:options.objectId||null,request_id:options.requestId||`req_${id.toLowerCase().replaceAll('-','_')}`,status:200,retry_count:0,mock:true,...options.technical}
  };
  if(options.code){value.code=options.code;value.codeType=options.codeType||'Python';}
  actions.push(value);return value;
 }

 action('ACT-PERSON-001','案件材料文本提取','PERSON-ST-01',ANALYSIS,'2026-09-24T09:14:31+08:00','3.1s',{输入文件:'案件笔录_20260924.pdf',页数:8},'已提取8页案件材料文本，生成可追溯文本 Artifact。',[noteText.id],{objectId:'obj_case_text_001'});
 action('ACT-PERSON-002','目标人员实体抽取','PERSON-ST-01',ANALYSIS,'2026-09-24T09:14:38+08:00','2.7s',{来源对象:'obj_case_text_001',实体类型:['人','身份证号','手机号','网络账号']},'确认目标人员陈骏、模拟身份证号和网络账号 cj_0816；现用手机号尚未确认。',[],{dependencies:['ACT-PERSON-001'],trace:['解析案件文本中的人员与稳定身份标识','确认陈骏和模拟身份证号','未发现可直接使用的现用手机号']});
 action('ACT-PERSON-003','调取云搜个人档案','PERSON-ST-02',INFO,'2026-09-24T09:15:03+08:00','18.0s',{工具:'调取云搜平台的个人档案信息',目标:'陈骏',身份证号:personCore.maskedIdNumber,查询范围:'人员档案 / 全部轨迹 / 铁路 / 民航 / 住宿 / 出入境等'},'执行成功；返回8类数据、23条记录。发现9月14日南京南→苏州园区铁路记录、景澜商务酒店过渡住宿及苏州工业园区活动增多。',[yunsou.id],{dependencies:['ACT-PERSON-002'],objectId:'obj_yunsou_001',startedAt:'2026-09-24T09:14:45+08:00'});
 action('ACT-PERSON-004','调取部刑专个人档案','PERSON-ST-02',INFO,'2026-09-24T09:15:11+08:00','20.0s',{工具:'调取部刑专平台的个人档案信息',目标:'陈骏',身份证号:personCore.maskedIdNumber,查询范围:'人基础信息 / 身份证-手机可信库 / 手机注册信息等'},'执行成功；首次动态发现2个可信手机号：176****4182、189****6731，并据此追加4个计划内调证 Action。',[buxing.id],{dependencies:['ACT-PERSON-002'],objectId:'obj_buxingzhuan_001',startedAt:'2026-09-24T09:14:51+08:00'});
 action('ACT-PERSON-005','手机号176****4182云镜设备与地址调取','PERSON-ST-03',INFO,'2026-09-24T09:16:02+08:00','44.0s',{工具:'调取云镜平台手机号相关的设备及地址信息',手机号:'176****4182',时间范围:'2026-08-26 ~ 2026-09-24'},'返回2个关联设备和28条位置记录；主设备 DVC-7F3C9A21，次设备 DVC-192E0B63；星澜智寓、澄湾数字产业园此时仅为候选位置。',[yj176.id],{dynamic:true,generatedBy:'ACT-PERSON-004',dependencies:['ACT-PERSON-004'],objectId:'obj_yunjing_phone_176_001',startedAt:'2026-09-24T09:15:18+08:00'});
 action('ACT-PERSON-006','手机号189****6731云镜设备与地址调取','PERSON-ST-03',INFO,'2026-09-24T09:16:08+08:00','44.0s',{工具:'调取云镜平台手机号相关的设备及地址信息',手机号:'189****6731',时间范围:'2026-08-26 ~ 2026-09-24'},'返回1个关联设备和9条位置记录；与176****4182共同关联主设备 DVC-7F3C9A21。',[yj189.id],{dynamic:true,generatedBy:'ACT-PERSON-004',dependencies:['ACT-PERSON-004'],objectId:'obj_yunjing_phone_189_001',startedAt:'2026-09-24T09:15:24+08:00'});
 action('ACT-PERSON-007','手机号176****4182美团外卖调取','PERSON-ST-03',INFO,'2026-09-24T09:16:19+08:00','48.0s',{工具:'调取美团外卖信息',手机号:'176****4182',时间范围:'2026-08-26 ~ 2026-09-24'},'返回8笔订单；首次将云镜的“星澜智寓附近”细化为星澜智寓3栋1207，并补充澄湾数字产业园B2座生活轨迹。',[mt176.id],{dynamic:true,generatedBy:'ACT-PERSON-004',dependencies:['ACT-PERSON-004'],objectId:'obj_meituan_176_001',startedAt:'2026-09-24T09:15:31+08:00'});
 action('ACT-PERSON-008','手机号189****6731美团外卖调取','PERSON-ST-03',INFO,'2026-09-24T09:16:25+08:00','47.0s',{工具:'调取美团外卖信息',手机号:'189****6731',时间范围:'2026-08-26 ~ 2026-09-24'},'返回3笔订单；两笔指向星澜智寓3栋，一笔指向澄湾数字产业园B2座，形成多手机号、多来源交叉。',[mt189.id],{dynamic:true,generatedBy:'ACT-PERSON-004',dependencies:['ACT-PERSON-004'],objectId:'obj_meituan_189_001',startedAt:'2026-09-24T09:15:38+08:00'});
 action('ACT-PERSON-009','多源地址提取','PERSON-ST-04',ANALYSIS,'2026-09-24T09:17:03+08:00','21.0s',{工具:'地址提取工具',输入文件:6,限定对象:'陈骏 / 2个动态发现手机号'},'从6份多源文档提取47条地址/位置事件：户籍1、铁路4、住宿3、设备31、外卖8。',[extracted.id],{dependencies:['ACT-PERSON-003','ACT-PERSON-004','ACT-PERSON-005','ACT-PERSON-006','ACT-PERSON-007','ACT-PERSON-008'],objectId:'obj_locations_extracted_001',code:`# 从已写入 Workspace 的多源 Artifact 提取地址事件\nrecords = extract_locations(source_files=6, subject="陈骏")\nassert len(records) == 47\nreturn records`});
 action('ACT-PERSON-010','地址标准化与归一','PERSON-ST-04',ANALYSIS,'2026-09-24T09:17:31+08:00','28.0s',{工具:'地址字段标准化 / 地址信息归一',输入事件:47,归一规则:'行政区划 + POI + 楼栋 + 别名'},'将47条事件归并为9个地点实体，统一星澜智寓和澄湾数字产业园的不同文本表达。',[normalized.id],{dependencies:['ACT-PERSON-009'],objectId:'obj_locations_normalized_001',startedAt:'2026-09-24T09:17:03+08:00',code:`aliases = normalize_address_fields(records)\nlocations = merge_same_physical_place(aliases)\nassert len(locations) == 9\nreturn locations`});
 action('ACT-PERSON-011','近30天活动时间线重建','PERSON-ST-05',ANALYSIS,'2026-09-24T09:18:14+08:00','43.0s',{运行环境:'Python / pandas',输入:'normalized_locations.json',分析步骤:'合并来源 / 统一时间 / 排序 / 昼夜标注 / 连续出现'},'生成30天 Timeline：9月14日进入苏州并过渡住宿，9月16日起形成星澜智寓/澄湾数字产业园双中心活动。',[timeline.id],{dependencies:['ACT-PERSON-010'],objectId:'obj_person_timeline_001',startedAt:'2026-09-24T09:17:31+08:00',code:`import pandas as pd\n\ndf = pd.read_json("normalized_locations.json")\ndf["event_time"] = pd.to_datetime(df["event_time"])\ndf = df.sort_values("event_time")\ndf["period"] = df["event_time"].dt.hour.map(classify_day_or_night)\ndf.to_csv("person_timeline.csv", index=False)`});
 action('ACT-PERSON-012','地址频次与活动区域分析','PERSON-ST-05',ANALYSIS,'2026-09-24T09:18:43+08:00','29.0s',{工具:'地址统计分析工具',维度:['地点','出现次数','最近出现','来源数','昼夜分布','连续天数']},'星澜智寓3栋20条、连续9天、夜间/清晨高；澄湾数字产业园B2座11条、日间高；景澜商务酒店2条、过渡住宿。',[frequency.id],{dependencies:['ACT-PERSON-011'],objectId:'obj_location_frequency_001',startedAt:'2026-09-24T09:18:14+08:00',code:`stats = timeline.groupby("location_id").agg(\n    total_events=("event_time", "count"),\n    last_seen=("event_time", "max"),\n    source_count=("source_type", "nunique")\n)\nreturn rank_activity_areas(stats)`});
 action('ACT-PERSON-013','潜藏地推理','PERSON-ST-06',ANALYSIS,'2026-09-24T09:19:16+08:00','33.0s',{工具:'地址推理工具',输入:['normalized_locations.json','person_timeline.csv','location_frequency.csv'],证据维度:'频次 / 最近性 / 昼夜 / 生活行为 / 多源交叉'},'第一潜藏地候选为星澜智寓3栋附近，1207室为重点核验地址；澄湾数字产业园B2座附近更符合白天工作、办事或固定活动区域。',[reasoning.id],{dependencies:['ACT-PERSON-012'],objectId:'obj_hideout_reasoning_001',startedAt:'2026-09-24T09:18:43+08:00',code:`matrix = build_evidence_matrix(\n    normalized="normalized_locations.json",\n    timeline="person_timeline.csv",\n    frequency="location_frequency.csv"\n)\nreturn infer_candidates(matrix, preserve_uncertainty=True)`});
 action('ACT-PERSON-014','人员研判报告生成','PERSON-ST-06',ANALYSIS,'2026-09-24T09:19:48+08:00','32.0s',{模板:'人员研判报告',章节:10,证据链:'Action → Tool Result → Artifact → Analysis → Conclusion'},'已生成人员统一视图、轨迹时间线、高频区域、潜藏地候选及可追溯证据链；所有判断保留不确定性并要求人工核验。',[report.id],{dependencies:['ACT-PERSON-013'],objectId:'obj_person_report_001',startedAt:'2026-09-24T09:19:16+08:00',code:`report = render_report(\n    identity="person_view",\n    timeline="person_timeline.csv",\n    frequency="location_frequency.csv",\n    reasoning="hideout_reasoning.md"\n)\nwrite_text("陈骏_人员研判报告.md", report)`});

 const actionById=Object.fromEntries(actions.map(item=>[item.id,item]));
 const source=(actionId,artifactId)=>ref(actionId,artifactId,actionById[actionId].subtaskId);
 function entity(id,name,type,icon,x,y,summary,role,actionId,sourceRefs,properties={},options={}){
  const item={id,name,title:name,type,icon,x,y,summary,role,provenance:`${actionId} · 虚构模拟`,state:'Success',properties:{...properties,数据说明:personNotice},discoveredBy:actionId,discoveredInSubtask:actionById[actionId].subtaskId,discoveredAt:actionById[actionId].completedAt,sourceRefs,inferred:!!options.inferred};
  if(options.refinedBy)item.refinedBy=options.refinedBy;
  entities.push(item);return item;
 }
 function relation(id,from,to,type,label,actionId,sourceRefs,properties={},inferred=false){
  const item={id,from,to,type,label,properties:{...properties,数据说明:personNotice},discoveredBy:actionId,discoveredInSubtask:actionById[actionId].subtaskId,discoveredAt:actionById[actionId].completedAt,sourceRefs,inferred};relations.push(item);return item;
 }

 entity('PERSON-CHEN','陈骏','人员','person',30,450,'人员研判对象 · 47条位置事件','目标人员','ACT-PERSON-002',[source('ACT-PERSON-001',noteText.id),source('ACT-PERSON-003',yunsou.id),source('ACT-PERSON-004',buxing.id)],{身份证号:personCore.maskedIdNumber,可信手机号:'2',关联设备:'2',重点活动区域:'2'});
 entity('IDENTITY-ID','身份证 320599********0018','身份标识','case',380,60,'稳定身份标识','模拟身份证','ACT-PERSON-002',[source('ACT-PERSON-001',noteText.id)],{身份证号:personCore.maskedIdNumber,姓名:'陈骏'});
 entity('IDENTITY-ACCOUNT','网络账号 cj_0816','网络账号','net',380,210,'案件材料已有账号','过往网络账号','ACT-PERSON-002',[source('ACT-PERSON-001',noteText.id)],{账号:'cj_0816',来源:'案件笔录'});
 entity('PHONE-176','手机号 176****4182','手机号','comm',380,390,'可信手机号 · 2026-09-23','动态发现手机号','ACT-PERSON-004',[source('ACT-PERSON-004',buxing.id)],{手机号:'176****4182',可信来源:'身份证-手机可信库',最近出现:'2026-09-23'});
 entity('PHONE-189','手机号 189****6731','手机号','comm',380,570,'可信手机号 · 2026-09-21','动态发现手机号','ACT-PERSON-004',[source('ACT-PERSON-004',buxing.id)],{手机号:'189****6731',可信来源:'手机注册信息 + 历史可信关系',最近出现:'2026-09-21'});
 entity('TRANSPORT-NJ-SZ','南京南 → 苏州园区','出行','net',380,750,'2026-09-14 · G71XX','铁路轨迹','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{出发:'南京南',到达:'苏州园区',到达时间:'2026-09-14 18:06'});
 entity('STAY-JINGLAN','景澜商务酒店','住宿','case',380,930,'09-14入住 · 09-15离店','过渡住宿','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{入住:'2026-09-14 20:41',离店:'2026-09-15 11:03',研判:'过渡住宿'});
 entity('LOCATION-HOUSEHOLD','昆山户籍地','地点','case',380,1110,'苏州市昆山市玉峰片区','户籍线索','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{地址:'苏州市昆山市玉峰片区',类型:'户籍地址'});
 entity('DEVICE-MAIN','DVC-7F3C9A21','设备','net',780,390,'主设备 · 最近07:43','关联主设备','ACT-PERSON-005',[source('ACT-PERSON-005',yj176.id),source('ACT-PERSON-006',yj189.id)],{关联手机号:'176****4182、189****6731',关系强度:'高',最近出现:'2026-09-24 07:43',最近位置:'星澜智寓附近'});
 entity('DEVICE-SECONDARY','DVC-192E0B63','设备','net',780,570,'次设备 · 中等关联','关联次设备','ACT-PERSON-005',[source('ACT-PERSON-005',yj176.id)],{关联手机号:'176****4182',关系强度:'中',最近出现:'2026-09-19 14:18'});
 entity('LIFE-MEITUAN','美团外卖生活轨迹','生活服务','comm',780,750,'11笔模拟订单','生活轨迹','ACT-PERSON-007',[source('ACT-PERSON-007',mt176.id),source('ACT-PERSON-008',mt189.id)],{订单:'11',手机号:'176****4182、189****6731',说明:'1207仅在美团结果后出现'});
 entity('LOCATION-XINGLAN','星澜智寓3栋','地点','case',1180,300,'第一潜藏地候选 · 重点核验','居住型高频区域','ACT-PERSON-013',[source('ACT-PERSON-005',yj176.id),source('ACT-PERSON-007',mt176.id),source('ACT-PERSON-008',mt189.id),source('ACT-PERSON-012',frequency.id)],{位置事件:'20',连续天数:'9',来源:'云镜设备位置、美团外卖',最近记录:'2026-09-24 08:16',重点精细地址:'3栋1207',研判:'第一潜藏地候选'},{inferred:true,refinedBy:'ACT-PERSON-007'});
 entity('LOCATION-CHENGWAN','澄湾数字产业园B2座','地点','case',1180,570,'第二重点活动区域','工作型高频区域','ACT-PERSON-012',[source('ACT-PERSON-005',yj176.id),source('ACT-PERSON-007',mt176.id),source('ACT-PERSON-012',frequency.id)],{位置事件:'11',主要时段:'09:30—18:30',最近记录:'2026-09-23 17:42',研判:'更符合工作、办事或固定活动区域'},{inferred:true});

 relation('PERSON-R-ID','PERSON-CHEN','IDENTITY-ID','身份标识','身份证','ACT-PERSON-002',[source('ACT-PERSON-001',noteText.id)],{关系:'人员—身份证'});
 relation('PERSON-R-ACCOUNT','PERSON-CHEN','IDENTITY-ACCOUNT','网络身份','账号','ACT-PERSON-002',[source('ACT-PERSON-001',noteText.id)],{关系:'人员—网络账号'});
 relation('PERSON-R-PHONE-176','PERSON-CHEN','PHONE-176','可信手机号关联','可信手机号','ACT-PERSON-004',[source('ACT-PERSON-004',buxing.id)],{来源:'部刑专身份证—手机可信库',最后记录:'2026-09-23'});
 relation('PERSON-R-PHONE-189','PERSON-CHEN','PHONE-189','可信手机号关联','可信手机号','ACT-PERSON-004',[source('ACT-PERSON-004',buxing.id)],{来源:'手机注册信息 + 历史可信关系',最后记录:'2026-09-21'});
 relation('PERSON-R-DEVICE-176','PHONE-176','DEVICE-MAIN','设备关联','主设备','ACT-PERSON-005',[source('ACT-PERSON-005',yj176.id)],{来源:'云镜手机号设备信息',关系强度:'高',最后出现:'2026-09-24 07:43'});
 relation('PERSON-R-DEVICE-189','PHONE-189','DEVICE-MAIN','设备关联','共同主设备','ACT-PERSON-006',[source('ACT-PERSON-006',yj189.id)],{来源:'云镜手机号设备信息',关系强度:'高'});
 relation('PERSON-R-DEVICE-SECONDARY','PHONE-176','DEVICE-SECONDARY','设备关联','次设备','ACT-PERSON-005',[source('ACT-PERSON-005',yj176.id)],{来源:'云镜手机号设备信息',关系强度:'中'});
 relation('PERSON-R-TRANSPORT','PERSON-CHEN','TRANSPORT-NJ-SZ','铁路出行','09-14进入苏州','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{来源:'云搜铁路售票',时间:'2026-09-14'});
 relation('PERSON-R-STAY','PERSON-CHEN','STAY-JINGLAN','旅客住宿','过渡住宿','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{来源:'云搜旅客住宿',入住:'2026-09-14 20:41'});
 relation('PERSON-R-HOUSEHOLD','PERSON-CHEN','LOCATION-HOUSEHOLD','户籍地','户籍线索','ACT-PERSON-003',[source('ACT-PERSON-003',yunsou.id)],{来源:'云搜人员基础'});
 relation('PERSON-R-LIFE-176','PHONE-176','LIFE-MEITUAN','生活服务关联','外卖订单','ACT-PERSON-007',[source('ACT-PERSON-007',mt176.id)],{订单数:'8'});
 relation('PERSON-R-LIFE-189','PHONE-189','LIFE-MEITUAN','生活服务关联','外卖订单','ACT-PERSON-008',[source('ACT-PERSON-008',mt189.id)],{订单数:'3'});
 relation('PERSON-R-MAIN-XINGLAN','DEVICE-MAIN','LOCATION-XINGLAN','设备位置','夜间/清晨高频','ACT-PERSON-012',[source('ACT-PERSON-005',yj176.id),source('ACT-PERSON-012',frequency.id)],{位置事件:'20',最近出现:'2026-09-24 07:43'});
 relation('PERSON-R-MAIN-CHENGWAN','DEVICE-MAIN','LOCATION-CHENGWAN','设备位置','日间高频','ACT-PERSON-012',[source('ACT-PERSON-005',yj176.id),source('ACT-PERSON-012',frequency.id)],{位置事件:'11',最近出现:'2026-09-23 17:42'});
 relation('PERSON-R-LIFE-XINGLAN','LIFE-MEITUAN','LOCATION-XINGLAN','收货地址','3栋1207','ACT-PERSON-007',[source('ACT-PERSON-007',mt176.id),source('ACT-PERSON-008',mt189.id)],{地址:'星澜智寓3栋1207',说明:'精细地址由美团结果发现'});
 relation('PERSON-R-LIFE-CHENGWAN','LIFE-MEITUAN','LOCATION-CHENGWAN','收货地址','B2座','ACT-PERSON-007',[source('ACT-PERSON-007',mt176.id),source('ACT-PERSON-008',mt189.id)],{地址:'澄湾数字产业园B2座'});
 relation('PERSON-R-HIDEOUT','PERSON-CHEN','LOCATION-XINGLAN','疑似落脚关系','第一潜藏地候选','ACT-PERSON-013',[source('ACT-PERSON-013',reasoning.id),source('ACT-PERSON-012',frequency.id)],{结论:'第一潜藏地候选',重点核验:'3栋1207',限制:'尚未确认实际居住或藏匿'},true);

 const eventSpecs=[
  ['query_received','2026-09-24T09:14:22+08:00'],
  ['intent_recognized','2026-09-24T09:14:24+08:00'],
  ['main_task_created','2026-09-24T09:14:26+08:00'],
  ['plan_generated','2026-09-24T09:14:28+08:00'],
  ['ACT-PERSON-001','2026-09-24T09:14:31+08:00'],
  ['ACT-PERSON-002','2026-09-24T09:14:38+08:00'],
  ['ACT-PERSON-003','2026-09-24T09:14:45+08:00'],
  ['ACT-PERSON-004','2026-09-24T09:15:11+08:00'],
  ['phone_discovered_176','2026-09-24T09:15:12+08:00'],
  ['phone_discovered_189','2026-09-24T09:15:12+08:00'],
  ['dynamic_actions_created','2026-09-24T09:15:15+08:00'],
  ['ACT-PERSON-005','2026-09-24T09:15:18+08:00'],
  ['ACT-PERSON-006','2026-09-24T09:15:24+08:00'],
  ['ACT-PERSON-007','2026-09-24T09:15:31+08:00'],
  ['ACT-PERSON-008','2026-09-24T09:15:38+08:00'],
  ['device_discovered','2026-09-24T09:16:02+08:00'],
  ['precise_location_discovered','2026-09-24T09:16:19+08:00'],
  ['ACT-PERSON-009','2026-09-24T09:17:03+08:00'],
  ['ACT-PERSON-010','2026-09-24T09:17:31+08:00'],
  ['ACT-PERSON-011','2026-09-24T09:18:14+08:00'],
  ['ACT-PERSON-012','2026-09-24T09:18:43+08:00'],
  ['ACT-PERSON-013','2026-09-24T09:19:16+08:00'],
  ['ACT-PERSON-014','2026-09-24T09:19:48+08:00'],
  ['task_done','2026-09-24T09:19:48+08:00']
 ];
 const events=eventSpecs.map(([type,at],index)=>({id:`PERSON-EV-${String(index+1).padStart(3,'0')}`,seq:index+1,type,at:Date.parse(at),toolCallId:type.startsWith('ACT-PERSON-')?type:undefined,status:type==='task_done'?'done':undefined,historical:true}));
 const discoveries=[
  {id:'PERSON-D-001',entityId:'PHONE-176',type:'phone',value:'17600004182',displayValue:'176****4182',discoveredBy:'ACT-PERSON-004',discoveredInSubtask:'PERSON-ST-02',discoveredAt:'2026-09-24T09:15:12+08:00'},
  {id:'PERSON-D-002',entityId:'PHONE-189',type:'phone',value:'18900006731',displayValue:'189****6731',discoveredBy:'ACT-PERSON-004',discoveredInSubtask:'PERSON-ST-02',discoveredAt:'2026-09-24T09:15:12+08:00'},
  {id:'PERSON-D-003',entityId:'DEVICE-MAIN',type:'device',value:'DVC-7F3C9A21',discoveredBy:'ACT-PERSON-005',discoveredInSubtask:'PERSON-ST-03',discoveredAt:'2026-09-24T09:16:02+08:00'},
  {id:'PERSON-D-004',entityId:'DEVICE-SECONDARY',type:'device',value:'DVC-192E0B63',discoveredBy:'ACT-PERSON-005',discoveredInSubtask:'PERSON-ST-03',discoveredAt:'2026-09-24T09:16:02+08:00'},
  {id:'PERSON-D-005',entityId:'LOCATION-XINGLAN',type:'location',value:'星澜智寓3栋',discoveredBy:'ACT-PERSON-005',refinedBy:'ACT-PERSON-007',discoveredInSubtask:'PERSON-ST-03',discoveredAt:'2026-09-24T09:16:19+08:00'},
  {id:'PERSON-D-006',entityId:'LOCATION-CHENGWAN',type:'location',value:'澄湾数字产业园B2座',discoveredBy:'ACT-PERSON-005',refinedBy:'ACT-PERSON-007',discoveredInSubtask:'PERSON-ST-03',discoveredAt:'2026-09-24T09:16:19+08:00'},
  {id:'PERSON-D-007',entityId:'LOCATION-XINGLAN',type:'analysis_result',value:'星澜智寓3栋附近',discoveredBy:'ACT-PERSON-013',discoveredInSubtask:'PERSON-ST-06',discoveredAt:'2026-09-24T09:19:16+08:00'}
 ];

 const query={
  id:PERSON_QUERY_ID,caseId:'CASE-2026-SZ-0924-041',kind:'person',mode:'deep',historical:true,
  originalQuery:personOriginalQuery,rewrittenTaskName:personIntent,
  scope:'人员研判 · 近30天 · 多源轨迹',
  scopeDetails:{subject:'陈骏',startDate:'2026-08-26',endDate:'2026-09-24',sources:['案件材料','个人档案','手机号设备位置','铁路/民航/住宿','外卖']},
  createdAt:'2026-09-24 09:14:22',completedAt:'2026-09-24 09:19:48',duration:'5分26秒',status:'done',
  planVersion:1,replanCount:0,previousPlans:[],subtasks,completedLeafTasks:6,totalLeafTasks:6,
  progressCompletedAt:Date.parse('2026-09-24T09:19:48+08:00'),finalConclusion:personConclusion,findings:personFindings,
  finalArtifacts:[report.id],attachmentIds:[uploadNote.id,uploadBase.id],
  recommendedQueries:['查看星澜智寓3栋附近的全部位置证据','对比星澜智寓与澄湾数字产业园的活动时段','继续关注DVC-7F3C9A21的最新位置','查看两个手机号与主设备的关联依据','查看陈骏近30天完整活动时间线','查看9月14日进入苏州后的轨迹变化'],
  graphButtonLabel:'查看人员关系图',executionActions:actions.map(item=>item.id),events,processedEventIds:[],discoveries
 };
 const agents=[
  {id:INFO,name:'信息获取 Agent',description:'个人档案 · 设备位置 · 生活轨迹'},
  {id:ANALYSIS,name:'数据分析 Agent',description:'实体解析 · 地址归一 · 轨迹重建 · 潜藏地分析'}
 ].map(agent=>({...agent,assignedSubtasks:subtasks.filter(st=>actions.some(item=>item.agentId===agent.id&&item.subtaskId===st.id)).map(st=>st.id),toolCalls:actions.filter(item=>item.agentId===agent.id)}));
 const run={query,agents,permissions:[],outputs:artifacts.filter(item=>item.sourceType!=='user_upload'),graphSeed:{entities,relations}};
 return {
  version,fixture:'person-v1',activeTab:'工作空间',queries:[run],activeQueryId:query.id,query,agents,permissions:[],artifacts,entities,relations,draft:'',
  graph:{zoom:'fit',selected:'PERSON-CHEN',width:1580,height:1260,relationListLabel:'人员关系'},
  ui:{expandedAgents:[INFO,ANALYSIS],expandedTools:[],expandedFolders:['UPLOAD',PERSON_QUERY_ID,`${PERSON_QUERY_ID}/01 人员统一档案`,`${PERSON_QUERY_ID}/06 最终报告`],expandedTurns:[],collapsedTurns:[],contextChips:[],recommendationOffsets:{},actionTabs:{},selectedPermissions:[],highlightUntil:0,messageScrollTop:0,followLatest:false,hasNewProgress:false},
  followupMessage:'已记录本次追问及所选人员、手机号、设备或地点上下文。当前 Demo 仅恢复已完成的历史证据，不连接真实调证服务，本轮没有新增手机号、设备、位置、Artifact 或研判结论；第一潜藏地候选仍需人工重点核验。'
 };
}
