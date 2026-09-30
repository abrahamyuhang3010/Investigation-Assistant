/**
 * Completed network-investigation history fixture.
 * All domains/IPs/MACs are reserved examples or locally administered values.
 * The initial Plan contains only pre-execution business steps; discovered objects
 * live exclusively in Actions, artifacts, entities and relations.
 */
export const NETWORK_SESSION_ID='SS-NET-20260926-0148';
export const NETWORK_QUERY_ID='TASK-NET-20260926-001';
const INFO='information-retrieval-agent',ANALYSIS='data-analysis-agent';
export const networkNotice='全部为虚构模拟数据，仅用于 Demo；分析结果为待核验线索，不构成违法认定。';

export const networkCore={
 domain:'secure-refund-center.example.com',app:'客服安全中心.apk',apkMd5:'5f7e99ab8b1e4fd6bd801fc3ec7dd583',
 terminals:{
  t1:{label:'Terminal-01',code:'7e2a8f5c0d8b43f3aa17c910d44b6e52',risk:'高',software:3,files:2,historyIps:['198.51.100.31','198.51.100.42','203.0.113.17','203.0.113.23'],router:'02:6A:9B:41:7C:10'},
  t2:{label:'Terminal-02',code:'a4f3d6987ec241c1b683c9ad7d91f5e0',risk:'高',software:2,files:1,historyIps:['198.51.100.42','203.0.113.17','203.0.113.61'],router:'02:6A:9B:41:7C:11'},
  t3:{label:'Terminal-03',code:'c91dbf4a3a9646159d14f32c77bf7248',risk:'低',software:0,files:0,historyIps:['198.51.100.71','203.0.113.72'],router:null}
 },
 commonHistoricalIps:['198.51.100.42','203.0.113.17'],commonRouterIp:'203.0.113.82',
 commonWifi:['02:10:7A:44:31:A0','02:10:7A:44:31:A1'],location:'Myawadi, Kayin State, Myanmar',locationHits:5,keyTerminalCoverage:'2 / 2',nest:'园区A（模拟）',nestHits:4
};

export const networkPlanNames=[
 '解析案件材料并确认初始网信线索',
 '基于涉案域名定位关联终端',
 '调取关联终端详细画像并识别重点嫌疑终端',
 '对嫌疑终端发现的历史IP、路由及Wi-Fi线索动态下钻',
 '汇总关联设备地址并分析疑似窝点',
 '整合网络基础设施、设备和位置线索生成研判结论'
];
export const networkOriginalQuery='分析涉案域名 secure-refund-center.example.com，\n查找关联的嫌疑终端，并结合终端历史IP、出口路由、\nWi-Fi等信息进一步研判可能的涉诈窝点。';
export const networkIntent='围绕涉案域名 secure-refund-center.example.com，\n对其关联终端进行溯源，并结合重点嫌疑终端的历史IP、\n出口路由、Wi-Fi和设备位置开展多层下钻分析，\n识别具有交叉印证的网络基础设施和疑似窝点线索。';
export const networkConclusion=`经对涉案域名 ${networkCore.domain} 开展网信流研判，共发现3个关联终端。其中2个终端存在异常软件、异常文件等较高风险特征，并在历史IP、出口网络和Wi-Fi设备等方面存在多项交叉关联。\n\n进一步对两个重点终端的历史IP、出口路由、关联Wi-Fi和网关位置进行分析后，多条设备位置线索集中指向 ${networkCore.location}，且最近活跃时间与案发时间较为接近。\n\n结合设备地址出现频次、重点终端覆盖情况及共同网络基础设施，该区域可作为后续重点核验的疑似窝点线索。`;
export const networkFindings=[
 '涉案域名共关联3个终端，其中2个终端具有较高风险特征。',
 '两个重点终端共同使用2个历史IP，并存在1个共同的路由关联IP。',
 '两条独立调证路径均命中 Wi-Fi 02:10:7A:44:31:A0 和 02:10:7A:44:31:A1。',
 '两个重点终端最近网关位置均指向 Myawadi, Kayin State, Myanmar。',
 '该区域共命中5次，覆盖2/2重点嫌疑终端。',
 '园区A（模拟）命中4次，建议结合其他侦查数据进一步核验。',
 'Terminal-03未发现明显异常软件和文件，本轮未继续自动下钻。'
];

export function createNetworkHistorySession(org){return {
 id:NETWORK_SESSION_ID,sessionId:NETWORK_SESSION_ID,title:'涉案域名嫌疑终端及窝点研判',org,caseId:null,projectName:'9·26 冒充平台客服诈骗案',type:'网络研判',category:'network-investigation',state:'DONE',stage:'Completed',step:6,attempt:1,planVersion:1,replanCount:0,seq:0,draft:'',createdAt:'2026-09-26T10:18:42+08:00',completedAt:'2026-09-26T10:31:17+08:00',updated:'2026-09-26 10:31:17',archived:false,question:networkOriginalQuery,steps:networkPlanNames.map((name,i)=>({id:`NET-ST-0${i+1}`,name,status:'DONE'})),messages:[],events:[],historicalFixture:'network-v1'
};}

const xlsxNames=['登录的微信_QQ信息.xlsx','出口路由信息.xlsx','终端异常软件清单.xlsx','搜索记录清单.xlsx','终端下载文件信息.xlsx','历史IP清单.xlsx','异常终端文件清单.xlsx'];
const analysisCode={
 'DOC-NET-001':`# 提取历史调证文件中的稳定字段\nfields = ["terminal_code", "client_ip", "terminal_type", "last_seen"]\nrows = extract_columns(workbook, fields)\nreturn rows`,
 'TERMINAL-RISK-001':`# 风险筛选只形成重点核验线索，不作违法认定\nfeatures = ["abnormal_software", "abnormal_files", "search_behavior", "downloads", "network_history"]\nranked = score_terminals(terminals, features)\nreturn ranked`,
 'ANALYSIS-GEO-001':`columns = ["entity_id", "entity_type", "terminal_id", "ip", "router_mac", "wifi_mac", "country", "region", "city", "longitude", "latitude", "last_seen", "source"]\nnormalized = normalize_location_evidence(inputs, columns)\nreturn normalized`,
 'ANALYSIS-GEO-002':`summary = aggregate_locations(normalized, by="location")\nsummary = summary.sort_values(["hits", "last_seen"], ascending=False)\nreturn summary`,
 'ANALYSIS-NEST-001':`signals = combine_signals(frequency, terminal_coverage, recency, common_ip, common_wifi, gateways)\nreturn build_suspected_nest(signals, require_verification=True)`,
 'ANALYSIS-RELATION-001':`overlap = compare_infrastructure(terminal_01, terminal_02)\nreturn {"common_history_ip": 2, "common_router_ip": 1, "common_wifi": 2, "location_consistent": True}`,
 'REPORT-001':`validated = validate_lineage(artifacts, actions, entities, relations)\nreport = render_report(validated, uncertainty_terms=["重点嫌疑终端", "疑似窝点", "建议进一步核验"])\nreturn report`
};

export function createHistoricalNetworkSnapshot(version){
 const subtasks=networkPlanNames.map((name,i)=>({id:`NET-ST-0${i+1}`,index:`0${i+1}`,name,status:'done',planVersion:1,dependencies:i?[`NET-ST-0${i}`]:[],dynamicActions:i===3}));
 const actions=[];
 function action(id,toolName,subtask,agentId,result,options={}){
  const start=options.startedAt||'2026-09-26T10:19:00+08:00',end=options.completedAt||new Date(Date.parse(start)+9000).toISOString();
  const item={id,toolId:id,toolName,subtaskId:subtasks[subtask-1].id,agentId,queryId:NETWORK_QUERY_ID,status:'done',duration:options.duration||`${((Date.parse(end)-Date.parse(start))/1000).toFixed(1)}s`,startedAt:start,completedAt:end,planVersion:1,attempt:1,dynamic:!!options.dynamic,generatedBy:options.generatedBy||null,params:options.params||{},trace:options.trace||[networkNotice,'读取历史执行记录，不重新调用外部接口'],resultSummary:result,artifacts:[],outputIds:[],dependencies:options.dependencies||[],technical:options.technical||{tool_id:id,request_id:`req_net_${id.toLowerCase().replaceAll('-','_')}`,status:200,retry_count:0}};
  if(analysisCode[id]){item.code=analysisCode[id];item.codeType='Python';}
  actions.push(item);return item;
 }
 action('CASE-ENTITY-001','提取网信相关实体',1,INFO,'提取人员林晓峰、涉案域名及“客服安全中心.apk”，域名与APK待交叉确认。',{startedAt:'2026-09-26T10:18:54+08:00',completedAt:'2026-09-26T10:19:06+08:00',params:{工具:'案情实体解析工具',输入:['林晓峰询问笔录_20260926.pdf','退款验证页面截图.png']}});
 action('APK-PARSE-001','解析涉案APK网络信息',1,INFO,'应用 com.service.security.center；MD5 5f7e99ab8b1e4fd6bd801fc3ec7dd583；通联域名与案件材料一致。',{startedAt:'2026-09-26T10:19:11+08:00',completedAt:'2026-09-26T10:19:31+08:00',params:{工具:'调取解析APK信息工具',输入:'客服安全中心.apk'}});
 action('NET-DOMAIN-001','域名关联终端溯源',2,INFO,'发现关联终端3个；生成域名解析、备案和访问客户端信息3份文档。',{startedAt:'2026-09-26T10:20:11+08:00',completedAt:'2026-09-26T10:20:28.400+08:00',duration:'17.4s',params:{工具:'IP溯源 / 域名溯源 / IP域名反解',RPA:'研判终端、虚拟账户等（锋刃）',输入:networkCore.domain,开始:'2026-09-26 10:20:11',完成:'2026-09-26 10:20:28',耗时:'17.4s'},technical:{endpoint:'/xzxt2-center/api/rpa/rpaDz/DMX_15',request_id:'req_net_domain_20260926_102011_1842',status:200,retry_count:0}});
 action('DOC-NET-001','提取网信调证文档关键字段',2,ANALYSIS,'提取 terminal_code、client_ip、terminal_type、last_seen，形成3条终端画像输入。',{startedAt:'2026-09-26T10:20:31+08:00',completedAt:'2026-09-26T10:20:38+08:00',dependencies:['NET-DOMAIN-001'],params:{工具:'文档分析工具',输入:`${networkCore.domain}_访问客户端信息.xlsx`}});
 const profile=(n,key,start,end)=>{const t=networkCore.terminals[key];return action(`TERMINAL-PROFILE-00${n}`,`${t.label}终端画像`,3,INFO,`${t.label}：异常软件${t.software}项，异常文件${t.files}项，历史IP ${t.historyIps.length}个，出口路由${t.router?1:0}个，风险标签${t.risk}。`,{startedAt:start,completedAt:end,dynamic:true,generatedBy:'DOC-NET-001',dependencies:['DOC-NET-001'],params:{工具:'终端画像',RPA:'调取终端详细信息（锋刃）',终端码:t.code},technical:{endpoint:'/xzxt2-center/api/rpa/rpaDz/DMX_16',request_id:`req_terminal_profile_00${n}`,status:200,retry_count:0}})};
 profile(1,'t1','2026-09-26T10:20:45+08:00','2026-09-26T10:21:13+08:00');profile(2,'t2','2026-09-26T10:20:46+08:00','2026-09-26T10:21:12+08:00');profile(3,'t3','2026-09-26T10:20:47+08:00','2026-09-26T10:21:08+08:00');
 action('TERMINAL-RISK-001','重点嫌疑终端筛选',3,ANALYSIS,'Terminal-01、Terminal-02具有较高风险特征，列为重点嫌疑终端；Terminal-03风险较低，本轮不继续自动下钻。',{startedAt:'2026-09-26T10:21:18+08:00',completedAt:'2026-09-26T10:21:29+08:00',dependencies:['TERMINAL-PROFILE-001','TERMINAL-PROFILE-002','TERMINAL-PROFILE-003'],params:{输入指标:['异常软件数量','异常文件数量','可疑搜索行为','可疑下载文件','历史IP / 路由是否有效']}});
 action('NET-IP-WIFI-001','历史IP关联Wi-Fi调证',4,INFO,'5个去重历史IP关联3个Wi-Fi设备；其中A0、A1进入后续交叉印证。',{startedAt:'2026-09-26T10:22:02+08:00',completedAt:'2026-09-26T10:22:26+08:00',dynamic:true,generatedBy:'TERMINAL-RISK-001',dependencies:['TERMINAL-RISK-001'],params:{工具:'调取嫌疑终端的历史IP，研判窝点',RPA:'调取IP关联wifi（云脉 / 云芳）',输入:['198.51.100.31','198.51.100.42','203.0.113.17','203.0.113.23','203.0.113.61']},technical:{endpoint:'/api/invoke/yunmai/yunmai1',request_id:'req_net_ip_wifi_001',status:200,retry_count:0}});
 const routerAction=(n,mac,ips,start,end)=>action(`NET-ROUTER-00${n}`,`Router-0${n}关联IP调证`,4,INFO,`路由 ${mac} 关联IP：${ips.join('、')}。`,{startedAt:start,completedAt:end,dynamic:true,generatedBy:`TERMINAL-PROFILE-00${n}`,dependencies:[`TERMINAL-PROFILE-00${n}`],params:{工具:'路由发现',RPA:'调取路由设备关联IP（锋刃）',输入:mac},technical:{endpoint:'/xzxt2-center/api/rpa/rpaDz/DMX_17',request_id:`req_net_router_00${n}`,status:200,retry_count:0}});
 routerAction(1,networkCore.terminals.t1.router,['203.0.113.81','203.0.113.82','203.0.113.83'],'2026-09-26T10:22:09+08:00','2026-09-26T10:22:29+08:00');routerAction(2,networkCore.terminals.t2.router,['203.0.113.82','203.0.113.84'],'2026-09-26T10:22:10+08:00','2026-09-26T10:22:28+08:00');
 action('NET-IP-WIFI-002','路由关联IP的Wi-Fi调证',4,INFO,'路由关联IP命中Wi-Fi A0、A1、C2；A0和A1与历史IP分支共同命中。',{startedAt:'2026-09-26T10:22:38+08:00',completedAt:'2026-09-26T10:23:02+08:00',dynamic:true,generatedBy:'NET-ROUTER-001',dependencies:['NET-ROUTER-001','NET-ROUTER-002'],params:{工具:'调取嫌疑终端的历史IP，研判窝点',RPA:'调取IP关联wifi（云脉 / 云芳）',输入:['203.0.113.81','203.0.113.82','203.0.113.83','203.0.113.84']},technical:{endpoint:'/api/invoke/yunmai/yunmai1',request_id:'req_net_ip_wifi_002',status:200,retry_count:0}});
 const gateway=(n,mac,coord,last,start,end)=>action(`NET-GATEWAY-00${n}`,`Router-0${n}网关画像`,4,INFO,`最近活跃位置：${networkCore.location}；经纬度 ${coord}；最后活跃 ${last}。`,{startedAt:start,completedAt:end,dynamic:true,generatedBy:`NET-ROUTER-00${n}`,dependencies:[`NET-ROUTER-00${n}`],params:{工具:'调取嫌疑终端连接的出口路由设备，研判窝点',RPA:'调取路由设备相关信息（云镜）',输入:mac},technical:{endpoint:'/xzxt2-center/api/rpa/rpaDz/DMX_08',request_id:`req_net_gateway_00${n}`,status:200,retry_count:0}});
 gateway(1,networkCore.terminals.t1.router,'98.558910, 16.632170','2026-09-25 22:41','2026-09-26T10:23:15+08:00','2026-09-26T10:23:36+08:00');gateway(2,networkCore.terminals.t2.router,'98.559060, 16.631920','2026-09-25 23:03','2026-09-26T10:23:16+08:00','2026-09-26T10:23:35+08:00');
 action('ANALYSIS-GEO-001','设备地址数据整理',5,ANALYSIS,'统一历史IP、路由IP、Wi-Fi和网关位置字段，形成可追溯地址明细。',{startedAt:'2026-09-26T10:24:02+08:00',completedAt:'2026-09-26T10:24:18+08:00',dependencies:['NET-IP-WIFI-001','NET-IP-WIFI-002','NET-GATEWAY-001','NET-GATEWAY-002'],params:{输入:['历史IP关联设备','历史IP关联Wi-Fi','路由IP关联设备','路由IP关联Wi-Fi','网关画像']}});
 action('ANALYSIS-GEO-002','设备地址频次与最新性分析',5,ANALYSIS,`${networkCore.location} 命中${networkCore.locationHits}次，覆盖${networkCore.keyTerminalCoverage}重点嫌疑终端，最近出现2026-09-25 23:03。`,{startedAt:'2026-09-26T10:24:24+08:00',completedAt:'2026-09-26T10:24:39+08:00',dependencies:['ANALYSIS-GEO-001'],params:{统计维度:['命中次数','重点终端覆盖','最近出现时间']}});
 action('ANALYSIS-NEST-001','疑似窝点分析',5,ANALYSIS,`形成疑似窝点区域 ${networkCore.location}；${networkCore.nest}命中${networkCore.nestHits}次，建议进一步核验。`,{startedAt:'2026-09-26T10:24:45+08:00',completedAt:'2026-09-26T10:25:03+08:00',dependencies:['ANALYSIS-GEO-002'],params:{依据:['地址出现频次','覆盖嫌疑终端数量','最近出现时间','历史IP交叉情况','Router IP交叉情况','Wi-Fi交叉情况','网关位置']}});
 action('ANALYSIS-RELATION-001','网络基础设施交叉关联分析',5,ANALYSIS,'两个重点嫌疑终端存在较强网络基础设施重合，建议作为同一网络环境下的重点关联设备继续核验。',{startedAt:'2026-09-26T10:25:08+08:00',completedAt:'2026-09-26T10:25:25+08:00',dependencies:['ANALYSIS-NEST-001'],params:{共同历史IP:2,共同Router关联IP:1,共同WiFi:2,高频地址:'一致',最近网关位置:'一致'}});
 const internalActions=[
  {id:'RESULT-AGGREGATOR-001',toolId:'Result Aggregator',toolName:'聚合网络研判结果',subtaskId:'NET-ST-06',agentId:ANALYSIS,queryId:NETWORK_QUERY_ID,status:'done',startedAt:'2026-09-26T10:26:02+08:00',completedAt:'2026-09-26T10:26:19+08:00',duration:'17.0s',planVersion:1,internal:true,dependencies:['ANALYSIS-RELATION-001'],resultSummary:'聚合案件实体、APK、域名、终端、IP、路由、Wi-Fi、网关、地址与窝点分析。'},
  {id:'RESULT-VALIDATOR-001',toolId:'Result Validator',toolName:'校验结果可追溯性',subtaskId:'NET-ST-06',agentId:ANALYSIS,queryId:NETWORK_QUERY_ID,status:'done',startedAt:'2026-09-26T10:26:22+08:00',completedAt:'2026-09-26T10:26:38+08:00',duration:'16.0s',planVersion:1,internal:true,dependencies:['RESULT-AGGREGATOR-001'],resultSummary:'终端、网络基础设施、位置和结论均可回溯到Action / Artifact；不确定性表述通过校验。'}
 ];
 action('REPORT-001','生成网信流研判报告',6,ANALYSIS,'生成《涉案域名嫌疑终端及窝点研判报告.pdf》，结论保留“重点嫌疑终端”“疑似窝点”“建议进一步核验”等限定。',{startedAt:'2026-09-26T10:29:41+08:00',completedAt:'2026-09-26T10:31:17+08:00',duration:'96.0s',dependencies:['RESULT-VALIDATOR-001'],params:{输入:'已校验的网络研判结果',输出:'涉案域名嫌疑终端及窝点研判报告.pdf'}});
 const allActions=[...actions,...internalActions].sort((a,b)=>Date.parse(a.startedAt)-Date.parse(b.startedAt));
 const byAction=Object.fromEntries(allActions.map(a=>[a.id,a]));
 const artifacts=[];
 const sizes={XLSX:'18.4 KB',JSON:'6.8 KB',PDF:'428 KB',PNG:'186 KB',APK:'7.2 MB'};
 function file(id,name,toolCallId,folder,options={}){
  const tool=byAction[toolCallId],type=options.type||name.split('.').pop().toUpperCase();
  const item={id:`NET-${id}`,name,type,size:options.size||sizes[type]||'8.0 KB',queryId:NETWORK_QUERY_ID,subtaskId:tool?.subtaskId||null,toolCallId:toolCallId||null,folder,folderPath:options.folderPath||[folder],sourceType:options.sourceType||'generated',createdAt:options.createdAt||tool?.completedAt||'2026-09-26T10:18:42+08:00',dataScope:options.dataScope||'2026-08-31 至 2026-09-26',recordCount:options.recordCount??0,generationStatus:'已就绪',validationSummary:options.validationSummary||'字段、来源与记录数校验通过',fixture:'network-v1',rows:options.rows,content:options.content,preview:options.preview};
  artifacts.push(item);if(tool){tool.artifacts.push(item.id);tool.outputIds.push(item.id);}return item;
 }
 const upload=(id,name,type,size,content)=>file(id,name,null,'UPLOAD',{type,size,sourceType:'user_upload',folderPath:['UPLOAD'],createdAt:'2026-09-26T10:18:42+08:00',dataScope:'用户上传原始材料',recordCount:1,validationSummary:'历史任务原始附件，内容为虚构模拟材料',content});
 const uploads=[upload('UPLOAD-STATEMENT','林晓峰询问笔录_20260926.pdf','PDF','1.8 MB','模拟询问笔录：记录涉案退款验证域名与“客服安全中心”应用线索。'),upload('UPLOAD-SCREENSHOT','退款验证页面截图.png','PNG','486 KB','模拟截图：退款验证页面展示 secure-refund-center.example.com。'),upload('UPLOAD-APK','客服安全中心.apk','APK','7.2 MB','模拟APK，仅记录元数据，不包含可执行二进制。')];
 file('APK-PARSE','客服安全中心_APK解析结果.json','APK-PARSE-001','01 初始网信线索',{type:'JSON',recordCount:1,content:JSON.stringify({app:'客服安全中心',package:'com.service.security.center',md5:networkCore.apkMd5,domain:networkCore.domain,ip:'203.0.113.47',sdkProviders:2,notice:networkNotice},null,2)});
 const domainRows=[['terminal_label','terminal_code','client_ip','terminal_type','last_seen'],...Object.values(networkCore.terminals).map((t,i)=>[t.label,t.code,['198.51.100.31','198.51.100.42','203.0.113.72'][i],i<2?'Android':'Windows',`2026-09-25 ${['21:58','22:16','18:42'][i]}`])];
 file('DOMAIN-DNS',`${networkCore.domain}_域名解析信息.xlsx`,'NET-DOMAIN-001','02 域名调证',{recordCount:2,rows:[['domain','resolved_ip','first_seen','last_seen'],[networkCore.domain,'203.0.113.47','2026-09-20 08:11','2026-09-26 09:42'],[networkCore.domain,'198.51.100.88','2026-09-22 14:03','2026-09-25 23:58']]});
 file('DOMAIN-FILING',`${networkCore.domain}_域名备案信息.xlsx`,'NET-DOMAIN-001','02 域名调证',{recordCount:1,rows:[['domain','filing_status','registrant','note'],[networkCore.domain,'未检出有效备案','—','模拟结果，建议结合注册商数据进一步核验']]});
 const clients=file('DOMAIN-CLIENTS',`${networkCore.domain}_访问客户端信息.xlsx`,'NET-DOMAIN-001','02 域名调证',{recordCount:3,rows:domainRows});
 const profileArtifacts={};
 Object.entries(networkCore.terminals).forEach(([key,t],index)=>{
  const actionId=`TERMINAL-PROFILE-00${index+1}`,folder='03 终端画像',path=[folder,t.label],loginCount=index===0?2:index===1?1:0;
  const specs={
   '登录的微信_QQ信息.xlsx':[['account_type','account_masked','last_login'],...Array.from({length:loginCount},(_,i)=>[i?'QQ':'微信',i?'29******51':'wx_***_center',`2026-09-${24+i} 20:1${i}`])],
   '出口路由信息.xlsx':[['terminal','router_mac','last_seen'],...(t.router?[[t.label,t.router,index?'2026-09-25 23:03':'2026-09-25 22:41']]:[])],
   '终端异常软件清单.xlsx':[['software','risk_tag'],...Array.from({length:t.software},(_,i)=>[`异常软件-${i+1}`,'较高风险特征'])],
   '搜索记录清单.xlsx':[['keyword','searched_at'],...(index<2?[[index?'账号安全验证':'客服退款通道','2026-09-25 19:26']]:[])],
   '终端下载文件信息.xlsx':[['filename','downloaded_at'],...(index<2?[[index?'security_patch.apk':'refund_helper.apk','2026-09-25 19:41']]:[])],
   '历史IP清单.xlsx':[['terminal','ip','last_seen'],...t.historyIps.map((ip,i)=>[t.label,ip,ip==='198.51.100.42'?'2026-09-25 21:58':ip==='203.0.113.17'?'2026-09-25 22:16':`2026-09-${20+i} 08:30`])],
   '异常终端文件清单.xlsx':[['filename','md5','risk_tag'],...Array.from({length:t.files},(_,i)=>[`异常文件-${i+1}.dat`,`0000000000000000000000000000000${i}`,'较高风险特征'])]
  };
  profileArtifacts[key]={};xlsxNames.forEach((name,i)=>{profileArtifacts[key][name]=file(`${t.label.toUpperCase()}-${i+1}`,name,actionId,folder,{folderPath:path,recordCount:Math.max(0,(specs[name]?.length||1)-1),rows:specs[name],dataScope:`${t.label} 历史画像`});});
 });
 file('HISTORY-IP-DEVICES','历史IP_关联设备.xlsx','NET-IP-WIFI-001','04 IP与Wi-Fi调证',{recordCount:5,rows:[['ip','terminal','last_seen'],['198.51.100.31','Terminal-01','2026-09-23 08:30'],['198.51.100.42','Terminal-01 / Terminal-02','2026-09-25 21:58'],['203.0.113.17','Terminal-01 / Terminal-02','2026-09-25 22:16'],['203.0.113.23','Terminal-01','2026-09-24 18:11'],['203.0.113.61','Terminal-02','2026-09-24 19:07']]});
 const historyWifi=file('HISTORY-IP-WIFI','历史IP_关联Wi-Fi.xlsx','NET-IP-WIFI-001','04 IP与Wi-Fi调证',{recordCount:3,rows:[['wifi_label','wifi_mac','source_branch'],['Wi-Fi A','02:10:7A:44:31:A0','历史IP'],['Wi-Fi B','02:10:7A:44:31:A1','历史IP'],['Wi-Fi Device 03','02:10:7A:44:31:B4','历史IP']]});
 const router1=file('ROUTER-01-IPS','路由连接终端信息_Router01.xlsx','NET-ROUTER-001','05 路由与网关',{recordCount:3,rows:[['router_mac','associated_ip'],[networkCore.terminals.t1.router,'203.0.113.81'],[networkCore.terminals.t1.router,'203.0.113.82'],[networkCore.terminals.t1.router,'203.0.113.83']]});
 const router2=file('ROUTER-02-IPS','路由连接终端信息_Router02.xlsx','NET-ROUTER-002','05 路由与网关',{recordCount:2,rows:[['router_mac','associated_ip'],[networkCore.terminals.t2.router,'203.0.113.82'],[networkCore.terminals.t2.router,'203.0.113.84']]});
 file('ROUTER-IP-DEVICES','路由设备关联IP_关联设备.xlsx','NET-IP-WIFI-002','04 IP与Wi-Fi调证',{recordCount:4,rows:[['associated_ip','router'],['203.0.113.81','Router-01'],['203.0.113.82','Router-01 / Router-02'],['203.0.113.83','Router-01'],['203.0.113.84','Router-02']]});
 const routerWifi=file('ROUTER-IP-WIFI','路由设备关联IP_关联Wi-Fi.xlsx','NET-IP-WIFI-002','04 IP与Wi-Fi调证',{recordCount:3,rows:[['wifi_label','wifi_mac','source_branch'],['Wi-Fi A','02:10:7A:44:31:A0','路由关联IP'],['Wi-Fi B','02:10:7A:44:31:A1','路由关联IP'],['Wi-Fi C','02:10:7A:44:31:C2','路由关联IP']]});
 const gateway1=file('GATEWAY-01','网关画像信息_Router01.xlsx','NET-GATEWAY-001','05 路由与网关',{recordCount:1,rows:[['router','location','longitude','latitude','last_seen'],['Router-01',networkCore.location,'98.558910','16.632170','2026-09-25 22:41']]});
 const gateway2=file('GATEWAY-02','网关画像信息_Router02.xlsx','NET-GATEWAY-002','05 路由与网关',{recordCount:1,rows:[['router','location','longitude','latitude','last_seen'],['Router-02',networkCore.location,'98.559060','16.631920','2026-09-25 23:03']]});
 file('RISK-RESULT','嫌疑终端筛选结果.xlsx','TERMINAL-RISK-001','06 分析结果',{recordCount:3,rows:[['terminal','risk','decision'],['Terminal-01','高','重点嫌疑终端，建议进一步核验'],['Terminal-02','高','重点嫌疑终端，建议进一步核验'],['Terminal-03','低','本轮不继续自动下钻']]});
 const geo=file('GEO-RESULT','设备地址聚合结果.xlsx','ANALYSIS-GEO-002','06 分析结果',{recordCount:3,rows:[['location','hits','key_terminal_coverage','last_seen'],[networkCore.location,5,'2 / 2','2026-09-25 23:03'],['Yangon, Myanmar',1,'1 / 2','2026-09-19 08:14'],['Bangkok, Thailand',1,'1 / 2','2026-08-31 18:09']]});
 const relationsArtifact=file('RELATION-JSON','网络基础设施关系.json','ANALYSIS-RELATION-001','06 分析结果',{type:'JSON',recordCount:7,content:JSON.stringify({commonHistoricalIps:networkCore.commonHistoricalIps,commonRouterAssociatedIp:networkCore.commonRouterIp,commonWifi:networkCore.commonWifi,location:networkCore.location,notice:networkNotice},null,2)});
 const nestArtifact=file('NEST-JSON','疑似窝点分析.json','ANALYSIS-NEST-001','06 分析结果',{type:'JSON',recordCount:1,content:JSON.stringify({suspectedLocation:networkCore.location,hits:5,keyTerminalCoverage:'2 / 2',suspectedPark:networkCore.nest,parkHits:4,assessment:'疑似窝点线索，建议结合其他侦查数据进一步核验',notice:networkNotice},null,2)});
 const report=file('REPORT','涉案域名嫌疑终端及窝点研判报告.pdf','REPORT-001','07 最终报告',{type:'PDF',sourceType:'final_output',recordCount:1,dataScope:'2026-08-31 至 2026-09-26 历史网络线索',content:[networkNotice,'涉案域名嫌疑终端及窝点研判报告','研判结论',networkConclusion,'关键发现',...networkFindings,'数据来源：案件材料、APK解析、域名调证、终端画像、历史IP、路由、Wi-Fi、网关画像与地址聚合。','限制：本报告仅展示虚构模拟线索，疑似窝点与重点嫌疑终端均需进一步核验。'].join('\n')});
 const ref=(toolCallId,artifactId)=>({queryId:NETWORK_QUERY_ID,subtaskId:byAction[toolCallId]?.subtaskId,toolCallId,artifactId});
 const entities=[];
 const addEntity=(id,name,type,icon,summary,properties,discoveredBy,sourceRefs,x,y,extra={})=>entities.push({id,name,title:name,type,subtype:type,icon,summary,role:type,state:'Success',properties:{...properties,线索性质:'模拟线索 · 待进一步核验'},discoveredBy,discoveredInSubtask:byAction[discoveredBy]?.subtaskId,discoveredAt:byAction[discoveredBy]?.completedAt,sourceRefs,x,y,...extra});
 addEntity('NET-APP','客服安全中心.apk','APP','net',`MD5 ${networkCore.apkMd5.slice(0,8)}…`,{Package:'com.service.security.center',MD5:networkCore.apkMd5,通联域名:networkCore.domain},'APK-PARSE-001',[ref('APK-PARSE-001','NET-APK-PARSE')],20,40);
 addEntity('NET-DOMAIN',networkCore.domain,'DOMAIN','net','涉案域名 · 已知初始线索',{域名:networkCore.domain,解析IP:'203.0.113.47',来源:'案件材料 / APK解析'},'CASE-ENTITY-001',[ref('CASE-ENTITY-001','NET-UPLOAD-STATEMENT'),ref('APK-PARSE-001','NET-APK-PARSE')],360,40);
 Object.entries(networkCore.terminals).forEach(([key,t],i)=>addEntity(`NET-${t.label.toUpperCase()}`,t.label,'TERMINAL','net',`${t.risk==='高'?'重点嫌疑终端':'低风险终端'} · 风险${t.risk}`,{终端码:t.code,风险:t.risk,异常软件:`${t.software}项`,异常文件:`${t.files}项`,历史IP:`${t.historyIps.length}个`,出口路由:t.router?'1个':'0个',关联证据:i<2?'9':'7'},'NET-DOMAIN-001',[ref('NET-DOMAIN-001',clients.id),ref(`TERMINAL-PROFILE-00${i+1}`,profileArtifacts[key]['历史IP清单.xlsx'].id)],760,40+i*190,{risk:t.risk}));
 const historyIps=['198.51.100.31','198.51.100.42','203.0.113.17','203.0.113.23','203.0.113.61'];
 historyIps.forEach((ip,i)=>addEntity(`NET-IP-H-${ip}`,ip,'IP','net',networkCore.commonHistoricalIps.includes(ip)?'共同历史IP':'历史IP',{IP:ip,类别:'历史IP',共同线索:networkCore.commonHistoricalIps.includes(ip)?'是':'否'},ip==='198.51.100.31'||ip==='203.0.113.23'?'TERMINAL-PROFILE-001':ip==='203.0.113.61'?'TERMINAL-PROFILE-002':'TERMINAL-PROFILE-001',[ref(ip==='203.0.113.61'?'TERMINAL-PROFILE-002':'TERMINAL-PROFILE-001',profileArtifacts[ip==='203.0.113.61'?'t2':'t1']['历史IP清单.xlsx'].id)],1160,20+i*130));
 addEntity('NET-ROUTER-01','Router-01','ROUTER','net',networkCore.terminals.t1.router,{路由MAC:networkCore.terminals.t1.router,关联IP:'3个'},'TERMINAL-PROFILE-001',[ref('TERMINAL-PROFILE-001',profileArtifacts.t1['出口路由信息.xlsx'].id),ref('NET-ROUTER-001',router1.id)],1160,720);
 addEntity('NET-ROUTER-02','Router-02','ROUTER','net',networkCore.terminals.t2.router,{路由MAC:networkCore.terminals.t2.router,关联IP:'2个'},'TERMINAL-PROFILE-002',[ref('TERMINAL-PROFILE-002',profileArtifacts.t2['出口路由信息.xlsx'].id),ref('NET-ROUTER-002',router2.id)],1160,900);
 ['203.0.113.81','203.0.113.82','203.0.113.83','203.0.113.84'].forEach((ip,i)=>addEntity(`NET-IP-R-${ip}`,ip,'IP','net',ip===networkCore.commonRouterIp?'共同路由关联IP':'路由关联IP',{IP:ip,类别:'路由关联IP',共同线索:ip===networkCore.commonRouterIp?'是':'否'},i<3?'NET-ROUTER-001':'NET-ROUTER-002',[ref(i<3?'NET-ROUTER-001':'NET-ROUTER-002',i<3?router1.id:router2.id)],1510,650+i*130));
 const wifiDefs=[['A0','Wi-Fi A','02:10:7A:44:31:A0','NET-IP-WIFI-001',historyWifi.id],['A1','Wi-Fi B','02:10:7A:44:31:A1','NET-IP-WIFI-001',historyWifi.id],['B4','Wi-Fi Device 03','02:10:7A:44:31:B4','NET-IP-WIFI-001',historyWifi.id],['C2','Wi-Fi C','02:10:7A:44:31:C2','NET-IP-WIFI-002',routerWifi.id]];
 wifiDefs.forEach(([id,name,mac,actionId,artifactId],i)=>addEntity(`NET-WIFI-${id}`,name,'WIFI','net',mac,{WiFi_MAC:mac,双路径印证:networkCore.commonWifi.includes(mac)?'是':'否'},actionId,[ref(actionId,artifactId)],1850,300+i*180));
 addEntity('NET-LOCATION-MYAWADI',networkCore.location,'LOCATION','case','高频位置 · 5次 · 覆盖2/2',{地址:networkCore.location,命中次数:'5',重点终端覆盖:'2 / 2',最近出现:'2026-09-25 23:03'},'NET-GATEWAY-001',[ref('NET-GATEWAY-001',gateway1.id),ref('NET-GATEWAY-002',gateway2.id),ref('ANALYSIS-GEO-002',geo.id)],2200,620);
 addEntity('NET-NEST-A',networkCore.nest,'NEST','case','疑似园区 · 命中4次',{名称:networkCore.nest,命中次数:'4',研判:'疑似窝点线索',建议:'结合其他侦查数据进一步核验'},'ANALYSIS-NEST-001',[ref('ANALYSIS-NEST-001',nestArtifact.id)],2520,620,{inferred:true});
 const relations=[];
 const addRelation=(id,from,to,type,label,sourceRefs,properties={},discoveredBy,inferred=false)=>relations.push({id,from,to,type,label:label||type,sourceRefs,properties,discoveredBy,discoveredAt:byAction[discoveredBy]?.completedAt,inferred});
 addRelation('NET-R-APP-DOMAIN','NET-APP','NET-DOMAIN','通联域名','通联', [ref('APK-PARSE-001','NET-APK-PARSE')],{关系:'APP通联域名',来源:'客服安全中心_APK解析结果.json'},'APK-PARSE-001');
 Object.values(networkCore.terminals).forEach((t,i)=>addRelation(`NET-R-DOMAIN-T${i+1}`,'NET-DOMAIN',`NET-${t.label.toUpperCase()}`,'域名关联终端','关联终端',[ref('NET-DOMAIN-001',clients.id)],{关系:'域名访问客户端',最后出现:domainRows[i+1][4],来源:`${networkCore.domain}_访问客户端信息.xlsx`},'NET-DOMAIN-001'));
 const terminalIpRelation=(terminalKey,terminalId,artifactKey)=>networkCore.terminals[terminalKey].historyIps.filter(ip=>historyIps.includes(ip)).forEach((ip,i)=>addRelation(`NET-R-${terminalKey.toUpperCase()}-H${i}`,terminalId,`NET-IP-H-${ip}`,'历史IP关联','历史IP',[ref(terminalKey==='t1'?'TERMINAL-PROFILE-001':'TERMINAL-PROFILE-002',profileArtifacts[terminalKey][artifactKey].id)],{关系:'历史IP关联',最后出现:ip==='198.51.100.42'?'2026-09-25 21:58':ip==='203.0.113.17'?'2026-09-25 22:16':'2026-09-24 18:11',来源:`${networkCore.terminals[terminalKey].label} / 历史IP清单.xlsx`},terminalKey==='t1'?'TERMINAL-PROFILE-001':'TERMINAL-PROFILE-002'));
 terminalIpRelation('t1','NET-TERMINAL-01','历史IP清单.xlsx');terminalIpRelation('t2','NET-TERMINAL-02','历史IP清单.xlsx');
 addRelation('NET-R-T1-ROUTER','NET-TERMINAL-01','NET-ROUTER-01','出口路由','出口路由',[ref('TERMINAL-PROFILE-001',profileArtifacts.t1['出口路由信息.xlsx'].id)],{关系:'出口路由关联',来源:'Terminal-01 / 出口路由信息.xlsx'},'TERMINAL-PROFILE-001');
 addRelation('NET-R-T2-ROUTER','NET-TERMINAL-02','NET-ROUTER-02','出口路由','出口路由',[ref('TERMINAL-PROFILE-002',profileArtifacts.t2['出口路由信息.xlsx'].id)],{关系:'出口路由关联',来源:'Terminal-02 / 出口路由信息.xlsx'},'TERMINAL-PROFILE-002');
 [['01',['81','82','83']],['02',['82','84']]].forEach(([router,ends])=>{const actionId=router==='01'?'NET-ROUTER-001':'NET-ROUTER-002',artifactId=router==='01'?router1.id:router2.id;ends.forEach(end=>addRelation(`NET-R-ROUTER-${router}-${end}`,`NET-ROUTER-${router}`,`NET-IP-R-203.0.113.${end}`,'路由关联IP','关联IP',[ref(actionId,artifactId)],{关系:'路由设备关联IP',来源:`路由连接终端信息_Router${router}.xlsx`},actionId));});
 ['198.51.100.42','203.0.113.17'].forEach((ip,i)=>networkCore.commonWifi.forEach((mac,j)=>addRelation(`NET-R-HW-${i}-${j}`,`NET-IP-H-${ip}`,`NET-WIFI-${mac.endsWith('A0')?'A0':'A1'}`,'IP关联Wi-Fi','关联Wi-Fi',[ref('NET-IP-WIFI-001',historyWifi.id)],{关系:'历史IP关联Wi-Fi',来源:'历史IP_关联Wi-Fi.xlsx'},'NET-IP-WIFI-001')));
 networkCore.commonWifi.forEach((mac,j)=>addRelation(`NET-R-RW-${j}`,`NET-IP-R-${networkCore.commonRouterIp}`,`NET-WIFI-${mac.endsWith('A0')?'A0':'A1'}`,'路由IP关联Wi-Fi','关联Wi-Fi',[ref('NET-IP-WIFI-002',routerWifi.id)],{关系:'路由关联IP的Wi-Fi关联',来源:'路由设备关联IP_关联Wi-Fi.xlsx'},'NET-IP-WIFI-002'));
 addRelation('NET-R-ROUTER1-LOC','NET-ROUTER-01','NET-LOCATION-MYAWADI','最近网关位置','位置',[ref('NET-GATEWAY-001',gateway1.id)],{关系:'最近网关位置',最后活跃:'2026-09-25 22:41',来源:'网关画像信息_Router01.xlsx'},'NET-GATEWAY-001');
 addRelation('NET-R-ROUTER2-LOC','NET-ROUTER-02','NET-LOCATION-MYAWADI','最近网关位置','位置',[ref('NET-GATEWAY-002',gateway2.id)],{关系:'最近网关位置',最后活跃:'2026-09-25 23:03',来源:'网关画像信息_Router02.xlsx'},'NET-GATEWAY-002');
 addRelation('NET-R-LOC-NEST','NET-LOCATION-MYAWADI','NET-NEST-A','疑似窝点包含','疑似窝点',[ref('ANALYSIS-NEST-001',nestArtifact.id)],{关系:'疑似窝点分析',命中次数:'4',来源:'疑似窝点分析.json',说明:'建议结合其他侦查数据进一步核验'},'ANALYSIS-NEST-001',true);
 const query={id:NETWORK_QUERY_ID,kind:'network',mode:'deep',historical:true,originalQuery:networkOriginalQuery,rewrittenTaskName:networkIntent,scope:'网信流研判 · 域名 / 终端 / IP / 路由 / Wi-Fi',scopeDetails:{subject:networkCore.domain,startDate:'2026-08-31',endDate:'2026-09-26',sources:['案件材料','域名调证','终端画像','网络基础设施']},createdAt:'2026-09-26 10:18:42',completedAt:'2026-09-26 10:31:17',status:'done',planVersion:1,replanCount:0,previousPlans:[],subtasks,completedLeafTasks:6,totalLeafTasks:6,progressCompletedAt:Date.parse('2026-09-26T10:31:17+08:00'),finalConclusion:networkConclusion,findings:networkFindings,finalArtifacts:[report.id],attachmentIds:uploads.map(a=>a.id),recommendedQueries:['继续分析两个重点终端登录的网络账号','查看两个重点终端共同使用的IP和Wi-Fi','查看疑似窝点位置的全部证据'],graphButtonLabel:'查看网络关系图',internalActions,executionActions:allActions.map(a=>a.id),events:[...allActions].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||a.id.localeCompare(b.id)).map((a,i)=>({id:`NET-EV-${String(i+1).padStart(3,'0')}`,seq:i+1,type:'tool_finished',at:Date.parse(a.completedAt),toolCallId:a.id,status:'done',historical:true,internal:!!a.internal})),processedEventIds:[]};
 const visibleActions=actions;
 const agents=[{id:INFO,name:'信息获取 Agent',description:'网信调证 · 终端查询 · 网络基础设施获取'},{id:ANALYSIS,name:'数据分析 Agent',description:'文档解析 · 终端筛选 · 地址聚合 · 窝点分析'}].map(a=>({...a,assignedSubtasks:subtasks.filter(st=>visibleActions.some(t=>t.agentId===a.id&&t.subtaskId===st.id)).map(st=>st.id),toolCalls:visibleActions.filter(t=>t.agentId===a.id)}));
 const run={query,agents,permissions:[],outputs:artifacts.filter(a=>a.queryId),graphSeed:{entities,relations}};
 return {version,fixture:'network-v1',activeTab:'工作空间',queries:[run],activeQueryId:query.id,query,agents,permissions:[],artifacts,entities,relations,draft:'',graph:{zoom:'fit',selected:'NET-TERMINAL-01',width:2820,height:1240,relationListLabel:'网络关系'},ui:{expandedAgents:[INFO,ANALYSIS],expandedTools:[],expandedFolders:['UPLOAD','01 初始网信线索','02 域名调证','07 最终报告'],expandedTurns:[],collapsedTurns:[],contextChips:[],recommendationOffsets:{},actionTabs:{},selectedPermissions:[],highlightUntil:0,messageScrollTop:0,followLatest:false,hasNewProgress:false},followupMessage:'已记录本次追问及所选网络实体 / 关系。当前 Demo 仅提供该已完成历史证据，不连接真实调证服务，本轮没有新增终端、IP、Wi-Fi、位置或研判结论。已有“重点嫌疑终端”和“疑似窝点”均为待进一步核验线索。'};
}
