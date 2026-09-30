/** V2.0 historical fixture. All identities and transactions are fictional.
 * Plan is deliberately separate from discoveries; cents are the source of truth.
 * This is a completed snapshot, never a scheduler seed.
 */
export const FUND_SESSION_ID='SS-20260918-0217';
export const FUND_QUERY_ID='TASK-20260918-0217';
const INFO='information-retrieval-agent', ANALYSIS='data-analysis-agent';
export const fundNotice='全部为虚构模拟数据，仅用于 Demo，不对应真实个人或案件；分析线索不构成违法认定。';
export const money=cents=>'¥'+(cents/100).toLocaleString('en-US',{maximumFractionDigits:2});
const mask=value=>/^\d{16}$/.test(value)?`${value.slice(0,4)} ${value.slice(4,6)}** **** ${value.slice(-4)}`:value.replace(/(.{3}).*(.{4})/,'$1****$2');
const accountSpecs=[
 ['chen','陈浩','银行卡','6214831000000927','招商银行','CASE-ENTITY-001'],
 ['zhou','周凯','银行卡','6222021200003813','中国工商银行','RPA-BANK-001'],
 ['lin','林泽宇','银行卡','6217001200038462','中国建设银行','FLOW-TRACE-001'],
 ['liu','刘倩','支付宝账号','2088427619054736','支付宝','RPA-PAY-001'],
 ['liang','梁嘉豪','银行卡','6228480402567714','中国农业银行','FLOW-TRACE-001'],
 ['jiang','蒋文浩','银行卡','6212260200045197','中国工商银行','FLOW-TRACE-002'],
 ['ma','马思远','财付通账号','wxpay_9317628405','财付通','FLOW-TRACE-003'],
 ['liangpay','梁嘉豪','财付通账号','tenpay_8251046937','财付通','RPA-BANK-003'],
 ['he','何俊峰','财付通账号','tenpay_6042189571','财付通','FLOW-TRACE-004'],
 ['merchant','深圳市迅达数码商行','商户','','银联二维码','FLOW-TRACE-001'],
 ['rail','12306','商户','','铁路购票','BEHAVIOR-001'],
 ['store','深圳北站某便利店','商户','','线下消费','BEHAVIOR-001'],
 ['meituan','美团订单','商户','','线上消费','BEHAVIOR-001']
];
export const fundAccounts=Object.fromEntries(accountSpecs.map(([id,name,type,number,bank,discoveredBy])=>[id,{id,name,type,number,masked:number?mask(number):'—',bank,discoveredBy}]));
const profiles={
 chen:{出生年份:1994,手机号:'138****2741'},
 zhou:{证件号:'32058219920816****',手机号:'186****5193',开户行:'中国工商银行苏州工业园区支行',开户日期:'2024-11-07',账户状态:'正常'},
 lin:{证件号:'44030519961102****',手机号:'137****8826',开户行:'中国建设银行深圳科技园支行',开户日期:'2025-03-19'},
 liu:{手机号:'159****3068',绑定银行卡:'6214 83** **** 6621'},
 liang:{证件号:'35020319940923****',手机号:'188****4620',开户行:'中国农业银行厦门湖里支行'},
 liangpay:{绑定手机号:'188****4620'}
};
// Reuse these records for the graph, tool results, XLSX/Parquet, report and assertions.
export const fundTransactions=[
 ['001','13:42:18','chen','zhou',50000,'ICBC2026091813421800381521','FLOW-LOCATE-001'],
 ['002','13:46:53','chen','zhou',30000,'ICBC2026091813465300381679','FLOW-LOCATE-001'],
 ['003','13:48:21','zhou','lin',30000,'ICBC2026091813482100381728','FLOW-TRACE-001'],
 ['004','13:49:37','zhou','liu',25000,'ICBC2026091813493700381765','FLOW-TRACE-001'],
 ['005','13:51:06','zhou','liang',20000,'ICBC2026091813510600381811','FLOW-TRACE-001'],
 ['006','13:54:12','zhou','merchant',5000,'ICBC2026091813541200381869','FLOW-TRACE-001'],
 ['007','13:53:44','lin','jiang',27500,'CCB2026091813534405729031','FLOW-TRACE-002'],
 ['008','13:52:06','liu','ma',24600,'ALI20260918135206000098217','FLOW-TRACE-003'],
 ['009','13:52:41','liang','liangpay',20000,null,'RPA-PAY-002'],
 ['010','13:57:33','liangpay','he',19600,'TEN2026091813573300452918','FLOW-TRACE-004'],
 ['011','13:56:10','lin','rail',500,null,'BEHAVIOR-001'],
 ['012','14:01:08','lin','store',1260,null,'BEHAVIOR-001'],
 ['013','13:55:31','liu','meituan',400,null,'BEHAVIOR-001']
].map(([id,time,from,to,amount,transactionId,discoveredBy])=>({id:`T-0918-${id}`,time:`2026-09-18 ${time}`,from,to,amountCents:amount*100,transactionId,discoveredBy}));
const sum=rows=>rows.reduce((n,t)=>n+t.amountCents,0);
export const fundMetrics={inflowCents:sum(fundTransactions.filter(t=>t.to==='zhou')),rapidOutflowCents:sum(fundTransactions.filter(t=>t.from==='zhou'&&t.time<='2026-09-18 13:51:18')),mainDownstreamCount:3};
fundMetrics.rapidRatio=fundMetrics.rapidOutflowCents/fundMetrics.inflowCents*100;
const planNames=['解析案件材料并确认涉案资金起点','调取初始收款账户主体信息及资金流水','定位涉案资金并追踪一级资金去向','对发现的下级账户开展动态调证与资金穿透','汇总资金特征、关联线索并生成研判报告'];
const originalQuery='分析陈浩被骗的8万元资金去向，追踪下级账户，识别相关可疑账户和资金转移渠道，并分析相关账户的资金特征。';
const conclusion=`陈浩被骗的${money(fundMetrics.inflowCents)}进入周凯名下工商银行卡 ${fundAccounts.zhou.masked} 后，在约9分钟内快速向多个下级账户拆分转移。其中${money(3000000)}转入林泽宇名下建设银行卡，${money(2500000)}转入刘倩名下支付宝账户，${money(2000000)}转入梁嘉豪名下农业银行卡。随后分别有${money(2750000)}、${money(2460000)}、${money(1960000)}流向蒋文浩、马思远、何俊峰，呈现短时间集中入账、快速拆分、多账户分流及银行卡与第三方支付混合转移特征。`;
const findings=[`已定位陈浩2笔涉案转账，合计${money(fundMetrics.inflowCents)}。`,`周凯账户约9分钟内主要转出${money(fundMetrics.rapidOutflowCents)}，快速转出比例${fundMetrics.rapidRatio}%，主要下级账户3个。`,`13:54:12另有${money(500000)}支付商户，不计入9分钟快速转出口径。`,'林泽宇与蒋文浩近30天互转31次、累计¥126,840，其中固定金额交易12次；实际关系待核验。','交通、城市与线下消费线索涉及12306、深圳、厦门及深圳北站便利店；蒋文浩、马思远、何俊峰为本轮穿透边界，仍需进一步调证。'];
const label=id=>fundAccounts[id].name+(id==='liangpay'?'财付通':id==='liu'?'支付宝':'');
const txText=rows=>rows.map(t=>`${t.time} ${label(t.from)} → ${label(t.to)} · ${money(t.amountCents)} · ${t.transactionId||'原附件未提供流水号'}`).join('\n');
const txFor=id=>fundTransactions.filter(t=>t.from===id||t.to===id);
const table=rows=>[['交易引用','时间','付款主体','付款账号（脱敏）','收款主体','收款账号（脱敏）','金额（元）','交易流水号'],...rows.map(t=>[t.id,t.time,label(t.from),fundAccounts[t.from].masked,label(t.to),fundAccounts[t.to].masked,t.amountCents/100,t.transactionId||'原附件未提供'])];
export function createFundHistorySession(org){return {id:FUND_SESSION_ID,title:'陈浩被骗资金流向研判',org,caseId:null,projectName:'9·18 冒充客服诈骗案',type:'资金流',category:'fund-investigation',state:'DONE',stage:'Completed',step:5,attempt:1,planVersion:1,seq:0,draft:'',createdAt:'2026-09-18T14:07:26+08:00',updated:'2026-09-18 14:16:42',archived:false,question:originalQuery,steps:planNames.map((name,i)=>({id:`FUND-ST-0${i+1}`,name,status:'DONE'})),messages:[],events:[],historicalFixture:'fund-v2'};}
export function createHistoricalFundSnapshot(version){
 const subtasks=planNames.map((name,i)=>({id:`FUND-ST-0${i+1}`,index:`0${i+1}`,name,status:'done',planVersion:1,dependencies:i?[`FUND-ST-0${i}`]:[]}));
 const actions=[];
 let clock=Date.parse('2026-09-18T14:07:35+08:00');
 function action(id,name,st,result,options={}){
  const start=options.startedAt||new Date(clock).toISOString(),end=options.completedAt||new Date(Date.parse(start)+9000).toISOString();
  clock=Date.parse(end)+5000;
  const a={id,toolId:id,toolName:name,subtaskId:subtasks[st-1].id,agentId:options.info?INFO:ANALYSIS,queryId:FUND_QUERY_ID,status:'done',duration:'9.0s',startedAt:start,completedAt:end,planVersion:1,attempt:1,params:{调用工具:options.internal||name,查询范围:'2026-09-18 00:00 ～ 2026-09-19 00:00',数据来源:'历史合成调证快照'},trace:[fundNotice,'读取历史执行记录，不重新调用外部接口'],resultSummary:result,artifacts:[],outputIds:[],dependencies:actions.length?[actions.at(-1).id]:[],technical:{tool_id:options.internal||id,request_id:`req_fund_20260918_${id.toLowerCase()}`,status:200,retry_count:0},...options};
  delete a.info;delete a.internal;if(a.generatedBy){a.generatedAt=actions.find(t=>t.id===a.generatedBy)?.completedAt;a.dependencies=[a.generatedBy];}actions.push(a);return a;
 }
 action('CASE-ENTITY-001','提取资金相关实体',1,`陈浩；付款卡 ${fundAccounts.chen.masked}；初始收款卡 ${fundAccounts.zhou.masked}；两笔转账 ¥50,000 / ¥30,000。`,{info:true});
 action('CASE-REL-002','解析资金转账关系',1,'陈浩 → 初始收款卡；13:42:18 ¥50,000；13:46:53 ¥30,000；收款主体待调证。',{info:true});
 action('CTX-001','检查已有研判资料',2,'当时 Session 尚无该卡调证结果，可继续发起调证。',{info:true,internal:'list_note / read_note'});
 action('RPA-BANK-001','初始收款银行卡开户及流水调取',2,`开户主体：周凯；资金流水8,214条（历史模拟返回总数，本 Demo 仅保留6条关键摘录）。初始入账两笔，合计${money(fundMetrics.inflowCents)}。`,{info:true,internal:'rpa_bankcard_query',duration:'18.2s',startedAt:'2026-09-18T14:08:31+08:00',completedAt:'2026-09-18T14:08:49.200+08:00',params:{调用工具:'调取银行卡资金开户信息和资金交易记录',目标账户:fundAccounts.zhou.masked,查询范围:'2026-09-18 00:00 ～ 2026-09-19 00:00',数据来源:'银行资金调证接口（模拟）',开始时间:'2026-09-18 14:08:31',完成时间:'2026-09-18 14:08:49',耗时:'18.2s'},technical:{tool_id:'rpa_bankcard_query',request_id:'req_fund_20260918_140831_4812',status:200,retry_count:0}});
 action('FILE-001','保存初始账户资金流水',2,'保存周凯账户6条关键流水摘录，来源返回总量8,214条；不伪造未提供的8,208条。',{info:true});
 action('NOTE-001','登记共享文件',2,'已登记初始账户流水与开户信息的来源引用。',{info:true});
 action('DATA-CHECK-001','检查资金流水数据质量',2,'历史检查记录：8,214条、31字段；缺失关键金额0、重复流水号0、时间异常0；对手账号缺失17、摘要缺失146。摘录不代表完整原始数据。',{code:'import pandas as pd\nflow = pd.read_excel("周凯_工商银行_20260918_资金流水.xlsx")\n# Demo 仅包含关键摘录，完整源数据质量指标来自历史 Trace\nassert flow["金额（元）"].notna().all()'});
 action('DATA-STD-001','资金主体字段标准化',2,'已统一主体、账户类型、开户行与脱敏标识字段。');
 action('DATA-STD-002','资金流水字段标准化',2,'初始账户6条关键流水摘录已标准化；历史源总量8,214条。');
 action('FLOW-LOCATE-001','涉案资金定位',3,txText(fundTransactions.slice(0,2))+`\n命中2笔，合计${money(fundMetrics.inflowCents)}。`);
 action('FLOW-TRACE-001','一级资金去向追踪',3,'识别银行卡下级主体林泽宇、梁嘉豪及支付宝账号（刘倩主体由后续平台调证确认）。\n'+txText(fundTransactions.slice(2,6)).replaceAll('刘倩支付宝','支付宝账号'));
 action('FLOW-TYPE-001','下级资金账户类型识别',3,'发现2个银行卡、1个支付宝账号及1个商户支付；下级主体待后续调证核验。');
 action('RPA-BANK-002','林泽宇银行卡开户及流水调取',4,txText(txFor('lin')),{info:true,dynamic:true,generatedBy:'FLOW-TYPE-001'});
 action('RPA-PAY-001','刘倩支付宝主体及流水调取',4,'开户主体：刘倩；绑定银行卡 6214 83** **** 6621。\n'+txText(txFor('liu')).replaceAll('马思远','待核验财付通'),{info:true,dynamic:true,generatedBy:'FLOW-TYPE-001'});
 action('RPA-BANK-003','梁嘉豪银行卡开户及流水调取',4,`开户主体：梁嘉豪；入账¥20,000；未发现同期向其他银行卡直接转出，发现绑定财付通 ${fundAccounts.liangpay.masked}。`,{info:true,dynamic:true,generatedBy:'FLOW-TYPE-001'});
 action('RPA-PAY-002','梁嘉豪关联财付通账户调取',4,txText(txFor('liangpay')),{info:true,dynamic:true,generatedBy:'RPA-BANK-003',dependencies:['RPA-BANK-003']});
 for(const [i,key] of ['lin','liu','liang','liangpay'].entries())action(`DATA-STD-00${i+3}`,`${label(key)}下级流水标准化`,4,`已标准化${txFor(key).length}条关键摘录，保留来源引用。`);
 for(const [i,key] of ['lin','liu','liangpay'].entries()){
  action(`FLOW-LOCATE-00${i+2}`,`${label(key)}账户涉案资金定位`,4,txText(txFor(key).filter(t=>t.to===key)));
  action(`FLOW-TRACE-00${i+2}`,`${label(key)}账户资金去向追踪`,4,txText(txFor(key).filter(t=>t.from===key)),key==='liu'?{trace:['进一步模拟调证财付通账号主体，识别为马思远；仍需真实来源核验。']}:{});
 }
 action('RISK-CHANNEL-001','资金转移渠道分析',5,'银行卡→银行卡、银行卡→支付宝、银行卡→财付通、第三方支付→第三方支付；多账户拆分与混合通道特征，不作法律定性。');
 action('RELATION-001','高频关联账户识别',5,findings[3],{params:{查询范围:'2026-08-20 ～ 2026-09-18（近30天）',数据来源:'历史关联统计（模拟），未提供31笔明细'}});
 action('BEHAVIOR-001','交通 / 城市 / 线下消费识别',5,'12306购票¥500；深圳北站便利店¥1,260；识别深圳、厦门。\n'+txText(fundTransactions.slice(10)));
 action('ANALYSIS-001','资金网络与收支特征分析',5,findings.slice(0,3).join('\n'),{metrics:{...fundMetrics},code:'import pandas as pd\nflow = pd.read_parquet("资金流水标准化结果.parquet")\nstart = pd.Timestamp("2026-09-18 13:42:18")\nincoming = flow[flow.target_id.eq("zhou")].amount_cents.sum()\nrapid = flow[flow.source_id.eq("zhou") & pd.to_datetime(flow.transaction_time).between(start, start + pd.Timedelta(minutes=9))].amount_cents.sum()\nassert incoming == 8000000 and rapid == 7500000\nassert rapid / incoming * 100 == 93.75'});
 action('AGGREGATE-001','聚合资金研判结果',5,'已聚合材料、开户、流水、两级穿透、账户关系和行为分析；后续节点未穿透。');
 action('VALIDATE-001','验证结果完整性',5,'金额、账户链路及产物引用已核对；蒋文浩、马思远、何俊峰需继续调证。完整源流水与历史31笔关系明细未提供，不宣称全量核验。');
 action('REPORT-001','生成资金研判报告',5,conclusion,{completedAt:'2026-09-18T14:16:42+08:00'});
 const byAction=Object.fromEntries(actions.map(a=>[a.id,a]));
 for(const [id,key] of [['RPA-BANK-001','zhou'],['RPA-BANK-002','lin'],['RPA-BANK-003','liang'],['RPA-PAY-001','liu'],['RPA-PAY-002','liangpay']])byAction[id].params={...byAction[id].params,目标账户:fundAccounts[key].masked,平台:fundAccounts[key].bank};
 const artifacts=[];
 function file(id,name,actionId,folder,data={}){
  const a=byAction[actionId];const item={id:`FUND-${id}`,name,type:name.split('.').at(-1).toUpperCase(),size:'Demo 摘录',sourceType:a?'tool_output':'user_upload',queryId:a?FUND_QUERY_ID:null,subtaskId:a?.subtaskId||null,agentId:a?.agentId||null,toolCallId:a?.id||null,folder,createdAt:a?.completedAt||'2026-09-18T14:07:26+08:00',recordCount:1,dataScope:'2026-09-18 · 虚构模拟数据',generationStatus:'可用',validationSummary:fundNotice,fixture:'fund-v2',...data};
  artifacts.push(item);if(a){a.artifacts.push(item.id);a.outputIds.push(item.id);}return item;
 }
 const uploads=[file('UPLOAD-1','陈浩询问笔录_20260918.pdf',null,'UPLOAD',{content:`${fundNotice}\n陈浩，男，1994年出生，138****2741。遭遇冒充电商客服诈骗，以关闭会员、解除自动扣费及资金验证为由被诱导转账。\n付款账户 ${fundAccounts.chen.masked}；初始收款账户 ${fundAccounts.zhou.masked}，主体待调证。\n13:42:18 ¥50,000；13:46:53 ¥30,000；合计¥80,000。`}),file('UPLOAD-2','招商银行转账凭证_0918.png',null,'UPLOAD',{content:`模拟转账凭证\n${fundAccounts.chen.masked} → ${fundAccounts.zhou.masked}\n2026-09-18 13:42:18 ¥50,000\n2026-09-18 13:46:53 ¥30,000\n合计 ¥80,000\n${fundNotice}`}),file('UPLOAD-3','冒充客服聊天记录导出.pdf',null,'UPLOAD',{content:`${fundNotice}\n模拟材料摘要（非真实聊天原文）：冒充客服以关闭误开会员、解除自动扣费为由，要求进行资金验证。\n初始收款卡 ${fundAccounts.zhou.masked}；被骗总额 ¥80,000。`})];
 const sourceFiles={};
 for(const [key,bank,act] of [['zhou','工商银行','RPA-BANK-001'],['lin','建设银行','RPA-BANK-002'],['liang','农业银行','RPA-BANK-003'],['liu','支付宝','RPA-PAY-001'],['liangpay','财付通','RPA-PAY-002']]){
  const acc=fundAccounts[key];file(`PROFILE-${key}`,`${acc.name}_${bank}${acc.type==='银行卡'?'开户':'主体'}信息.json`,act,'01 身份与开户信息',{content:JSON.stringify({姓名:acc.name,账号:acc.masked,机构:acc.bank,...profiles[key],说明:fundNotice},null,2)});
  sourceFiles[key]=file(`FLOW-${key}`,`${acc.name}_${bank}_20260918_资金流水.xlsx`,act,['zhou','lin','liang'].includes(key)?'02 银行流水':'03 第三方账号',{rows:table(txFor(key)),recordCount:txFor(key).length,sourceRecordCount:key==='zhou'?8214:null,validationSummary:`${fundNotice} 本文件为${txFor(key).length}条关键摘录${key==='zhou'?'；历史源返回8,214条，不包含其余8,208条':''}。`});
 }
 // Saving/registering an existing file must not create a duplicate business artifact.
 for(const id of ['FILE-001','NOTE-001'])byAction[id].artifacts.push(sourceFiles.zhou.id);
 const normalized=fundTransactions.map(t=>({transaction_id:t.transactionId||t.id,transaction_time:t.time,source_id:t.from,target_id:t.to,source_name:label(t.from),target_name:label(t.to),source_account:fundAccounts[t.from].masked,target_account:fundAccounts[t.to].masked,account_type:fundAccounts[t.to].type,amount_cents:t.amountCents,amount:t.amountCents/100,channel:fundAccounts[t.to].bank}));
 file('STANDARD','资金流水标准化结果.parquet','DATA-STD-002','04 数据清洗与分析',{records:normalized.filter(t=>t.source_id==='zhou'||t.target_id==='zhou'),rows:table(txFor('zhou')),recordCount:6,validationSummary:'初始账户6条摘录；下级记录分别保存在后续标准化文件中。'});
 for(const [i,key] of ['lin','liu','liang','liangpay'].entries())file(`STANDARD-${key}`,['lin_zeyu_flow_standardized.parquet','liu_qian_alipay_standardized.parquet','liang_jiahao_flow_standardized.parquet','liang_jiahao_tenpay_standardized.parquet'][i],`DATA-STD-00${i+3}`,'04 数据清洗与分析',{records:normalized.filter(t=>t.source_id===key||t.target_id===key),rows:table(txFor(key)),recordCount:txFor(key).length});
 file('HOP-1','一级资金穿透结果.json','FLOW-TRACE-001','04 数据清洗与分析',{content:JSON.stringify(fundTransactions.slice(2,6),null,2),recordCount:4});
 file('HOP-2','二级资金穿透结果.json','AGGREGATE-001','04 数据清洗与分析',{content:JSON.stringify(fundTransactions.slice(6,10),null,2),recordCount:4});
 for(const [id,key] of [['FLOW-TRACE-002','lin'],['FLOW-TRACE-003','liu'],['FLOW-TRACE-004','liangpay']])file(`TRACE-${key}`,`${label(key)}资金去向追踪.json`,id,'04 数据清洗与分析',{content:JSON.stringify(txFor(key).filter(t=>t.from===key),null,2),recordCount:txFor(key).filter(t=>t.from===key).length});
 file('BEHAVIOR','资金行为分析结果.json','ANALYSIS-001','04 数据清洗与分析',{content:JSON.stringify({metrics:fundMetrics,findings,relationship:{count:31,totalCents:12684000,fixedAmountCount:12,period:'2026-08-20 ～ 2026-09-18',limitation:'历史统计摘要，无31笔明细'},notice:fundNotice},null,2)});
 const ref=(actionId,artifactId)=>({queryId:FUND_QUERY_ID,subtaskId:byAction[actionId].subtaskId,toolCallId:actionId,artifactId});
 const evidence=key=>sourceFiles[key]?.id||sourceFiles[({jiang:'lin',ma:'liu',he:'liangpay',merchant:'zhou',rail:'lin',store:'lin',meituan:'liu'})[key]]?.id;
 const entities=[];
 for(const acc of Object.values(fundAccounts)){
  const act=byAction[acc.discoveredBy],personId=`FUND-P-${acc.name}`;
  if(acc.type!=='商户'&&!entities.some(e=>e.id===personId))entities.push({id:personId,name:acc.name,title:acc.name,type:'人员',icon:'person',summary:acc.name==='陈浩'?'受害人（模拟）':'账户主体（模拟）',role:'资金线索主体',state:'Success',properties:{姓名:acc.name,...profiles[acc.id],...(acc.id==='zhou'?{银行卡:acc.masked,银行:acc.bank,涉案入账:money(fundMetrics.inflowCents),'9分钟内主要转出':money(fundMetrics.rapidOutflowCents),快速转出比例:'93.75%',主要下级账户:3}:{}),说明:fundNotice},discoveredBy:acc.discoveredBy,discoveredInSubtask:act.subtaskId,discoveredAt:act.completedAt,sourceRefs:[ref(act.id,acc.id==='chen'?uploads[0].id:evidence(acc.id))]});
  entities.push({id:`FUND-A-${acc.id}`,name:acc.type==='商户'?acc.name:`${label(acc.id)} · ${acc.type}`,title:label(acc.id),type:acc.type,icon:'funds',summary:`${acc.bank} · ${acc.masked}`,role:acc.type,state:'Success',properties:{主体:acc.name,账号:acc.masked,机构:acc.bank,说明:fundNotice},discoveredBy:act.id,discoveredInSubtask:act.subtaskId,discoveredAt:act.completedAt,sourceRefs:[ref(act.id,acc.id==='chen'?uploads[1].id:evidence(acc.id))]});
 }
 const columns={chen:0,zhou:1,lin:2,liu:2,liang:2,merchant:2,jiang:3,ma:3,liangpay:3,he:4,rail:3,store:3,meituan:3};
 const lanes={chen:1,zhou:1,lin:0,liu:1,liang:2,merchant:3,jiang:0,ma:1,liangpay:2,he:2,rail:3,store:4,meituan:5};
 for(const acc of Object.values(fundAccounts)){
  const node=entities.find(e=>e.id===`FUND-A-${acc.id}`);node.x=22+columns[acc.id]*390;node.y=70+lanes[acc.id]*320;
  const person=entities.find(e=>e.id===`FUND-P-${acc.name}`);if(person&&person.x==null){person.x=node.x;person.y=node.y+145;}
 }
 const relations=fundTransactions.map(t=>({...t,id:`FUND-R-${t.id}`,from:`FUND-A-${t.from}`,to:`FUND-A-${t.to}`,type:'资金往来',label:money(t.amountCents),discoveredAt:byAction[t.discoveredBy].completedAt,sourceRefs:[...new Set([sourceFiles[t.from]?.id,sourceFiles[t.to]?.id].filter(Boolean))].map(id=>ref(t.discoveredBy,id))}));
 for(const acc of Object.values(fundAccounts).filter(a=>a.type!=='商户'))relations.push({id:`FUND-OWNS-${acc.id}`,from:`FUND-P-${acc.name}`,to:`FUND-A-${acc.id}`,type:'持有',label:'持有',sourceRefs:[ref(acc.discoveredBy,acc.id==='chen'?uploads[0].id:evidence(acc.id))]});
 file('GRAPH','fund_graph.json','ANALYSIS-001','05 图表与关系数据',{content:JSON.stringify({entities,relations,metrics:fundMetrics,notice:fundNotice},null,2),recordCount:relations.length});
 file('GRAPH-IMAGE','陈浩案资金关系图.png','ANALYSIS-001','05 图表与关系数据',{graphTransactions:fundTransactions.slice(0,10),content:txText(fundTransactions.slice(0,10))});
 const report=file('REPORT','陈浩被骗资金流向研判报告.pdf','REPORT-001','06 最终报告',{sourceType:'final_output',content:[fundNotice,'研判结论',conclusion,'关键发现',...findings,'资金路径（关键记录摘录）',txText(fundTransactions.slice(0,10)),'来源：'+artifacts.filter(a=>a.toolCallId).map(a=>a.name).join('、'),'限制：所有接口为 Mock；关键流水摘录不等于全量调证资料，后续账户尚未继续穿透。'].join('\n')});
 const query={id:FUND_QUERY_ID,kind:'fund',mode:'deep',historical:true,originalQuery,rewrittenTaskName:'围绕陈浩被骗的8万元资金，以初始收款账户为起点，对涉案资金进行定位、下级账户追踪和多层资金穿透，并结合账户资金行为与关联关系识别重点资金线索。',scope:'涉案金额 ¥80,000 · 2026-09-18 起 · 银行及第三方支付流水',scopeDetails:{subject:'陈浩',startDate:'2026-09-18',endDate:'2026-09-19',sources:['银行','第三方支付流水']},createdAt:'2026-09-18 14:07:26',completedAt:'2026-09-18 14:16:42',status:'done',planVersion:1,previousPlans:[],subtasks,completedLeafTasks:5,totalLeafTasks:5,progressCompletedAt:Date.parse('2026-09-18T14:16:42+08:00'),finalConclusion:conclusion,findings,finalArtifacts:[report.id],attachmentIds:uploads.map(a=>a.id),recommendedQueries:['继续追踪蒋文浩、马思远、何俊峰的资金去向','核验林泽宇与蒋文浩的人员关联关系','查看周凯账户涉案资金转出明细'],events:actions.map((a,i)=>({id:`FUND-EV-${i+1}`,seq:i+1,type:'tool_finished',at:Date.parse(a.completedAt),toolCallId:a.id,status:'done',historical:true})),processedEventIds:[]};
 const agents=[{id:INFO,name:'信息获取 Agent',description:'资金调证 · 账号查询 · 流水获取'},{id:ANALYSIS,name:'数据分析 Agent',description:'数据清洗 · 资金穿透 · 线索关联'}].map(a=>({...a,assignedSubtasks:subtasks.filter(st=>actions.some(t=>t.agentId===a.id&&t.subtaskId===st.id)).map(st=>st.id),toolCalls:actions.filter(t=>t.agentId===a.id)}));
 // Static binary artifacts are generated by scripts/build-fund-artifacts.mjs from this same fixture.
 artifacts.forEach(a=>{if(['PDF','PNG','PARQUET'].includes(a.type))a.downloadUrl=`/assets/super-search/fund-history/${a.id}.${a.type.toLowerCase()}`;});
 const run={query,agents,permissions:[],outputs:artifacts.filter(a=>a.queryId),graphSeed:{entities,relations}};
 return {version,fixture:'fund-v2',activeTab:'工作空间',queries:[run],activeQueryId:query.id,query,agents,permissions:[],artifacts,entities,relations,draft:'',graph:{zoom:'fit',selected:'FUND-P-周凯',width:1870,height:1990},ui:{expandedAgents:[INFO,ANALYSIS],expandedTools:[],expandedFolders:['UPLOAD',FUND_QUERY_ID,'06 最终报告'],expandedTurns:[],collapsedTurns:[],contextChips:[],recommendationOffsets:{},selectedPermissions:[],highlightUntil:0,messageScrollTop:0,followLatest:false,hasNewProgress:false}};
}
