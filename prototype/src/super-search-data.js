/** Synthetic fixtures only. No external data or permission service is contacted. */
export function createDemoSeed(){return {
  version:1,
  activeTab:'工作空间',
  query:{
    id:'QUERY-01',
    originalQuery:'查一下张三 220221194509013544',
    rewrittenTaskName:'对目标人员张三进行身份背景、关联账户、资金流水及第三方支付账户关联信息研判',
    status:'waiting_approval',
    scope:'身份背景 · 关联账户 · 资金流水 · 第三方支付账户',
    createdAt:'2026-09-21 21:09',
    subtasks:[
      {id:'ST-01',index:'01',name:'核验张三身份与基础档案',status:'done',dependencies:[],workerAgentId:'information-retrieval-agent'},
      {id:'ST-02',index:'02',name:'调取关联银行卡开户信息及交易流水',status:'done',dependencies:['ST-01'],workerAgentId:'information-retrieval-agent'},
      {id:'ST-03',index:'03',name:'查询第三方支付账号主体信息',status:'waiting_approval',dependencies:['ST-01'],workerAgentId:'information-retrieval-agent',permissionRequests:['PERM-NET']},
      {id:'ST-04',index:'04',name:'对资金流水进行收支、异常交易和关联关系分析',status:'dependency_blocked',dependencies:['ST-02','ST-03'],workerAgentId:'data-analysis-agent'},
      {id:'ST-05',index:'05',name:'汇总研判结论并生成报告',status:'pending',dependencies:['ST-04'],workerAgentId:'data-analysis-agent'}
    ],
    finalConclusion:'已核验张三身份及关联银行卡，完成 2,341 条流水的采集与标准化。第三方支付账户主体查询仍需授权，当前结论为阶段性结果。',
    finalArtifacts:['ART-REPORT'],
    recommendedQueries:['继续分析交易对手的多跳资金路径','核验高频夜间交易的对手方身份','按月对比张三账户的收支变化']
  },
  permissions:[{id:'PERM-NET',permissionCode:'RPA_NET_QUERY_PERMISSION',permissionName:'第三方平台账号主体查询',status:'pending',relatedSubtaskIds:['ST-03'],relatedToolCallIds:['TOOL-NET']}],
  agents:[
    {id:'information-retrieval-agent',name:'信息获取 Agent',description:'负责外部调证、数据库查询与来源采集',assignedSubtasks:['ST-01','ST-02','ST-03'],toolCalls:[
      {id:'TOOL-PROFILE',toolId:'PROFILE-QUERY-001',toolName:'个人基础档案查询',subtaskId:'ST-01',status:'done',duration:'6s',params:{subject_id:'220221********3544',scope:'基础档案'},trace:['校验主体稳定标识','访问授权范围内档案索引','完成来源与字段映射'],resultSummary:'返回 1 份个人基础档案，主体标识核验一致。',artifacts:['ART-PROFILE']},
      {id:'TOOL-BANK',toolId:'RPA-BANK-001',toolName:'开户信息查询',subtaskId:'ST-02',status:'done',duration:'12s',params:{subject_id:'220221********3544',account_scope:'本人名下'},trace:['建立只读 RPA 会话','查询开户主体及账户状态','生成结构化结果文件'],resultSummary:'发现 1 张有效关联银行卡，开户主体与张三一致。',artifacts:['ART-BANK']},
      {id:'TOOL-FLOW',toolId:'RPA-FLOW-002',toolName:'银行流水拉取',subtaskId:'ST-02',status:'done',duration:'28s',params:{bank_card:'6222 **** 3544',start_time:'2026-08-01',end_time:'2026-08-30'},trace:['校验明细访问范围','分批拉取银行流水','校验记录总量与文件摘要'],resultSummary:'执行成功，返回 2,341 条流水数据。',artifacts:['ART-FLOW']},
      {id:'TOOL-NET',toolId:'RPA-NET-001',toolName:'第三方平台账号主体查询',subtaskId:'ST-03',status:'waiting_approval',duration:'—',params:{subject_id:'220221********3544',platforms:['微信支付','支付宝']},trace:['已生成最小权限申请','等待 RPA_NET_QUERY_PERMISSION 授权'],resultSummary:'尚未执行。授权通过后将从检查点自动恢复。',artifacts:[],permissionRequestId:'PERM-NET',error:{code:'403_FORBIDDEN',message:'当前账号缺少第三方平台主体查询权限'}}
    ]},
    {id:'data-analysis-agent',name:'数据分析 Agent',description:'负责解析、标准化、统计、关系分析与报告生成',assignedSubtasks:['ST-04','ST-05'],toolCalls:[
      {id:'TOOL-PARSE',toolId:'FILE-PARSE-003',toolName:'流水文件解析',subtaskId:'ST-04',status:'done',duration:'4s',params:{artifact_id:'ART-FLOW',sheet:'流水明细'},trace:['识别工作表与字段行','解析 2,341 条记录','保留原始行号与来源引用'],resultSummary:'解析完成，未发现结构损坏。',artifacts:[]},
      {id:'TOOL-NORM',toolId:'FLOW-NORM-002',toolName:'流水字段标准化',subtaskId:'ST-04',status:'done',duration:'3s',params:{input:'ART-FLOW',standard:'资金流水字段规范 v2'},trace:['统一交易方向与币种','规范账户及时间字段','生成可追溯标准化文件'],resultSummary:'2,341 条记录完成字段标准化。',artifacts:['ART-NORM'],code:`from workflow import normalize_flow\n\nresult = normalize_flow(\n    source="银行流水信息.xlsx",\n    keep_source_ref=True,\n    schema_version="v2"\n)`},
      {id:'TOOL-METRIC',toolId:'METRIC-004',toolName:'收支统计',subtaskId:'ST-04',status:'dependency_blocked',duration:'—',params:{input:'ART-NORM',dimensions:['日','交易方向','对手方']},trace:['等待第三方账户主体结果补齐关联维度'],resultSummary:'等待前置任务完成。',artifacts:[]},
      {id:'TOOL-LINK',toolId:'FLOW-LINK-007',toolName:'可疑资金关联分析',subtaskId:'ST-04',status:'dependency_blocked',duration:'—',params:{depth:2,min_amount:5000},trace:['等待收支统计完成'],resultSummary:'等待前置任务完成。',artifacts:[]},
      {id:'TOOL-REPORT',toolId:'REPORT-002',toolName:'分析结果生成',subtaskId:'ST-05',status:'pending',duration:'—',params:{template:'资金关联研判报告'},trace:['等待分析任务完成'],resultSummary:'尚未开始。',artifacts:[]}
    ]}
  ],
  artifacts:[
    {id:'ART-UPLOAD',name:'打包客服测试.zip',type:'ZIP',size:'3.69 KB',sourceType:'user_upload',queryId:null,preview:'用户上传的合成测试材料。'},
    {id:'ART-PROFILE',name:'个人基础档案.xlsx',type:'XLSX',size:'8.4 KB',sourceType:'tool_output',queryId:'QUERY-01',subtaskId:'ST-01',agentId:'information-retrieval-agent',toolCallId:'TOOL-PROFILE',preview:'姓名：张三\n主体状态：有效\n来源：PROFILE-QUERY-001'},
    {id:'ART-BANK',name:'开户信息.xlsx',type:'XLSX',size:'12.1 KB',sourceType:'tool_output',queryId:'QUERY-01',subtaskId:'ST-02',agentId:'information-retrieval-agent',toolCallId:'TOOL-BANK',preview:'银行卡：6222 **** 3544\n开户主体：张三\n账户状态：正常'},
    {id:'ART-FLOW',name:'银行流水信息.xlsx',type:'XLSX',size:'184 KB',sourceType:'tool_output',queryId:'QUERY-01',subtaskId:'ST-02',agentId:'information-retrieval-agent',toolCallId:'TOOL-FLOW',preview:'共 2,341 条流水\n时间范围：2026-08-01 至 2026-08-30\n币种：CNY'},
    {id:'ART-NORM',name:'标准化流水.xlsx',type:'XLSX',size:'192 KB',sourceType:'analysis_output',queryId:'QUERY-01',subtaskId:'ST-04',agentId:'data-analysis-agent',toolCallId:'TOOL-NORM',preview:'标准化记录：2,341 条\n字段规范：v2\n保留原始来源引用'},
    {id:'ART-REPORT',name:'资金分析报告.pdf',type:'PDF',size:'—',sourceType:'final_output',queryId:'QUERY-01',subtaskId:'ST-05',agentId:'data-analysis-agent',toolCallId:'TOOL-REPORT',preview:'最终报告将在所有前置任务完成后生成。',pending:true}
  ],
  entities:[
    {id:'SS-E-001',name:'张三',title:'张三',type:'人员',icon:'person',summary:'身份证 220221********3544',role:'目标人员',provenance:'PROFILE-QUERY-001 · 已核验',state:'Success',properties:{姓名:'张三',身份证号:'220221********3544',手机号:'138 **** 5678'},sourceRefs:[{queryId:'QUERY-01',subtaskId:'ST-01',toolCallId:'TOOL-PROFILE',artifactId:'ART-PROFILE'}]},
    {id:'SS-E-002',name:'银行卡 6222 **** 3544',title:'银行卡 6222 **** 3544',type:'账户',icon:'funds',summary:'开户主体：张三',role:'关联银行卡',provenance:'RPA-BANK-001 · 已核验',state:'Success',properties:{银行卡号:'6222 **** 3544',开户主体:'张三',账户状态:'正常'},sourceRefs:[{queryId:'QUERY-01',subtaskId:'ST-02',toolCallId:'TOOL-BANK',artifactId:'ART-BANK'}]},
    {id:'SS-E-003',name:'手机号 138 **** 5678',title:'手机号 138 **** 5678',type:'号码',icon:'comm',summary:'实名主体：张三',role:'关联手机号',provenance:'PROFILE-QUERY-001 · 已核验',state:'Success',properties:{手机号:'138 **** 5678',实名主体:'张三'},sourceRefs:[{queryId:'QUERY-01',subtaskId:'ST-01',toolCallId:'TOOL-PROFILE',artifactId:'ART-PROFILE'}]},
    {id:'SS-E-004',name:'银行卡 6217 **** 8866',title:'银行卡 6217 **** 8866',type:'账户',icon:'funds',summary:'交易对手方 · 待核验',role:'交易对手方',provenance:'RPA-FLOW-002 · 待核验',state:'Idle',properties:{银行卡号:'6217 **** 8866',累计流入:'¥38,600',核验状态:'待核验'},sourceRefs:[{queryId:'QUERY-01',subtaskId:'ST-02',toolCallId:'TOOL-FLOW',artifactId:'ART-FLOW'}]}
  ],
  relations:[
    {id:'SS-R-001',from:'SS-E-001',to:'SS-E-002',type:'持有',label:'持有',sourceRefs:[{toolCallId:'TOOL-BANK',artifactId:'ART-BANK'}]},
    {id:'SS-R-002',from:'SS-E-001',to:'SS-E-003',type:'绑定',label:'绑定',sourceRefs:[{toolCallId:'TOOL-PROFILE',artifactId:'ART-PROFILE'}]},
    {id:'SS-R-003',from:'SS-E-002',to:'SS-E-004',type:'转账',label:'转账',inferred:true,sourceRefs:[{toolCallId:'TOOL-FLOW',artifactId:'ART-FLOW'}]}
  ],
  ui:{expandedAgents:['information-retrieval-agent','data-analysis-agent'],expandedTools:['TOOL-NET','TOOL-NORM'],expandedFolders:['UPLOAD','QUERY-01','QUERY-02'],permissionExpanded:false,selectedEntityId:'SS-E-001',highlightTool:null}
}}

