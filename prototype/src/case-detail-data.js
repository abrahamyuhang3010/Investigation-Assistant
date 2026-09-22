/** Case-owned synthetic fixtures. IDs, documents, entities and reports share one model. */
export const detailCategories = {funds:'资金流',person:'人员流',net:'网络流',comm:'通讯流'};
const fixtures = {
  'CASE-0817': {victim:'张宝林',witness:'王策汐',people:['孙帝','孟昭鑫'],amount:128000,date:'2026-09-12',type:'投资平台诈骗',account:['1028','0319','4512','7288','6071','8846'],phone:'137****8890',network:'invest_demo',platform:'示例投资平台',device:'DEMO-INV',payments:[20000,10000]},
  'CASE-0802': {victim:'陈晓禾',witness:'周明远',people:['林青','赵文'],amount:46000,date:'2026-08-02',type:'关联账户核查',account:['2206','4182','6630','9007','5529','7613'],phone:'136****2436',network:'store_demo',platform:'示例交易平台',device:'DEMO-STORE',payments:[16000,30000]},
};
export function detailData(c,flow) {
  if(flow.detail?.version===1)return flow.detail;
  const f=fixtures[c.id];
  const base={version:1,revision:1,category:'funds',forensicCategory:'funds',collapsed:false,viewerTab:'detail',resultTab:'entities',page:1,zoom:100,entityPage:1,query:'',docQuery:'',graphQuery:'',graphCategory:'all',layer:'all',reportSection:2,questionnaire:'',sources:[],entities:[],forensics:[],transcripts:[],reportId:null};
  if(!f)return flow.detail={...base,summary:'尚未导入案情材料。请添加合成材料；本地演示不提供真实解析。',original:'',type:c.category||'其他线索',date:c.updated,amount:c.amount||0};
  const d={...base,...structuredClone(f),amount:c.amount??f.amount};
  const amount=d.amount.toLocaleString('zh-CN');
  d.original=`【合成案例 · 非真实业务数据】\n${f.date}，${f.victim}反映其通过${f.platform}与账号 ${f.network} 联系，按对方要求从尾号${f.account[0]}、${f.account[1]}账户转款，申报损失共${amount}元。\n材料记载收款账户尾号${f.account[4]}，联络号码${f.phone}；另附尾号${f.account[2]}、${f.account[3]}、${f.account[5]}的转账记录。账户户主及资金性质尚待核验。\n${f.witness}在两次合成笔录中分别补充转账经过与后续联络信息；${f.people.join('、')}出现在现勘材料中，不能据此认定其真实身份或涉案性质。`;
  d.summary=`当前为${f.type}合成案例。材料记载申报损失${amount}元；案情、现勘与笔录中的相同示例标识保留并列来源，关联身份与资金性质均待人工核验。`;
  d.sources.push({id:'original',name:'原始报案材料',kind:'case',demo:true,pages:[d.original]});
  f.people.forEach((name,i)=>{
    const id=`forensic-${i+1}`;
    const doc={id,name,filename:`${name}_手机提取示例.txt`,identity:`DEMO-ID-0${i+1}`,device:`${f.device}-${i+1}`,role:'材料关联人员',date:f.date,demo:true,account:`DEMO-PAY-${f.account[i+4]}`,transactions:f.payments.map((v,j)=>({id:`TX-${i+1}-${j+1}`,platform:i?'示例银行':'示例支付',account:`DEMO-${f.account[i+4]}`,name:i?f.people[0]:f.victim,amount:i?v/2:v,time:`${f.date} ${15+i}:${String(5+j).padStart(2,'0')}`}))};
    d.forensics.push(doc);
    d.sources.push({id,name:doc.filename,kind:'forensic',demo:true,pages:[`【合成现勘】材料主体：${name}；设备：${doc.device}；身份标识：${doc.identity}。示例资金账户${doc.account}，出现收款尾号${f.account[4]}、账号${f.network}、号码${f.phone}。设备与人员归属待核验。\n资金数据表：\n${doc.transactions.map(t=>`${t.id} · ${t.account} · ${t.amount}元 · ${t.time}`).join('\n')}`]});
  });
  for(let i=0;i<2;i++){
    const id=`transcript-${i+1}`,name=`${f.witness} 第${i+1}次`;
    const qa=i?[
      ['本次补充哪些信息？',`再次确认收款账户尾号${f.account[4]}，之后通过${f.phone}联系，对方继续使用账号${f.network}。`],
      ['能否确认材料中关联人员的身份？',`材料出现${f.people.join('、')}，但我无法确认账号实名或设备归属。请以核验结果为准。`],
      ['是否存在与第一次陈述不一致的内容？','第一次无法回忆联络号码，本次补充聊天截图；截图真实性尚未核验。']
    ]:[
      ['请陈述与本案有关的情况。',`我通过${f.platform}接触账号${f.network}。先后使用尾号${f.account[0]}、${f.account[1]}账户转款。`],
      ['是否能提供交易凭证？',`已提供尾号${f.account[2]}、${f.account[4]}的合成记录。所述转账合计${amount}元，资金归属尚待核对。`],
      ['是否记得后续联系方式？','目前无法完整回忆，将在补充询问中提供材料。']
    ];
    const pages=qa.map(([q,a],p)=>`电子笔录                         第${i+1}次\n\n询问笔录（合成示例）\n时间：${f.date} ${13+i}:20\n地点：演示询问室\n询问人：演示研判员    记录人：演示记录员\n被询问人：${f.witness}\n\n问：${q}\n答：${a}\n\n本页为第${p+1}页，所有标识与内容仅用于交互演示。`);
    d.transcripts.push({id,name,person:f.witness,sequence:i+1,date:f.date,role:i?'补充询问':'证人',demo:true,qa});
    d.sources.push({id,name:`${name}笔录`,kind:'transcript',demo:true,pages});
  }
  const add=(id,category,type,title,role,person,detail,refs)=>d.entities.push({id,category,type,title,role,person,detail,origin:'材料记载',refs:refs.map(([sourceId,page=1])=>({sourceId,page}))});
  f.account.forEach((tail,i)=>add(`bank-${i}`, 'funds','银行卡',`尾号 ${tail}`,i<2?'受害人账户':'收款账户',i<2?f.victim:'待核验',i===4?`申报损失 ¥${amount} · 待核验`:'开户信息待核验', [['original'],...(i<3||i===4?[['transcript-1',i===4||i===2?2:1]]:[]),...(i===4?[['transcript-2',1],['forensic-1'],['forensic-2']]:[]),...(i===5?[['forensic-2']]:[])]));
  add('victim','person','人员',f.victim,'报案人',f.victim,'原始案情材料主体',[['original']]);
  f.people.forEach((p,i)=>add(`person-${i}`,'person','人员',p,'材料关联人员',p,'身份与设备归属待核验',[[`forensic-${i+1}`],['transcript-2',2]]));
  add('network','net','网络账号',f.network,'联络账号','待核验',f.platform,[['original'],['forensic-1'],['forensic-2'],['transcript-1',1],['transcript-2',1]]);
  add('phone','comm','手机号码',f.phone,'联络号码','待核验','实名与通联内容待核验',[['original'],['forensic-1'],['forensic-2'],['transcript-2',1]]);
  d.forensicId=d.forensics[0].id;d.transcriptId=d.transcripts[0].id;
  flow.detail=d;return d;
}
export const sourceById=(d,id)=>d.sources.find(s=>s.id===id);
export const documentEntities=(d,id)=>d.entities.filter(e=>e.refs.some(r=>r.sourceId===id));
export function detailGraph(d,full=false) {
  const order=['victim','bank-0','bank-4','network','phone','person-0','person-1'];
  const positions=[[40,192],[330,72],[330,252],[620,72],[620,252],[930,122],[930,312]];
  const extra=d.entities.filter(e=>!order.includes(e.id)&&(full||e.origin==='人工补充'));
  extra.forEach((e,i)=>{order.push(e.id);positions.push([40+(i%4)*300,480+Math.floor(i/4)*156]);});
  const nodes=order.map((id,i)=>{const e=d.entities.find(e=>e.id===id);if(!e)return null;return {...e,id:e.id,key:e.id,icon:e.category,category:detailCategories[e.category],summary:e.detail,provenance:`来源：${sourceById(d,e.refs[0]?.sourceId)?.name||'人工补充'}`,state:'Idle',x:positions[i][0],y:positions[i][1]};}).filter(Boolean);
  const links=[['victim','bank-0','材料记载'],['victim','bank-4','转账陈述'],['bank-0','network','账号关联'],['bank-4','phone','联络陈述'],['network','person-0','主体待核验'],['phone','person-0','关系待核验'],['phone','person-1','主体待核验']].filter(([a,b])=>nodes.some(n=>n.id===a)&&nodes.some(n=>n.id===b)).map(([from,to,label])=>({from,to,label,inferred:label.includes('待核验')}));
  return {nodes,links,width:1360,height:extra.length?480+Math.ceil(extra.length/4)*156:470};
}
export const reportSections=['案件概况','材料与范围','关键实体与关系','资金关系','通讯与网络','研判结论','待核验事项'];
export function reportParagraphs(c,d) {
  const funds=d.entities.filter(e=>e.category==='funds').map(e=>e.title).join('、')||'无资金实体';
  return [
    [`${c.name}（${c.number}）。${d.summary}`],
    [`本轮包含${d.sources.length}份材料、${d.entities.length}条实体。${d.sources.map(s=>s.name).join('；')}。`, '范围：本地合成材料展示，不连接真实查询、解析或生产授权服务。'],
    [`【材料记载】${d.summary}`,`【材料记载】${funds}。相同示例标识保留多个来源，尾号相同并不构成真实身份的唯一依据。`,`【待核验推断】${d.entities.filter(e=>e.category==='person'&&e.id!=='victim').map(e=>e.title).join('、')||'尚无可关联的人员线索'}仅为材料中出现的对象，不能直接认定为嫌疑人。人工补充实体独立标识。`],
    [`【材料记载】${funds}。`, '【待核验】申报金额与各份现勘交易表的覆盖范围不同，不应将示例流水直接相加认定损失。'],
    [`【材料记载】${d.entities.filter(e=>['net','comm'].includes(e.category)).map(e=>e.title).join('、')||'暂无相关实体'}。`, '【待核验】需核对账号实名、设备归属、联络时点及原始记录完整性。'],
    ['仅形成待核验线索，不构成对身份、主观故意或行为性质的认定。应结合合法取得的原始材料与反证独立复核。'],
    ['核验原始凭证、账号归属和材料完整性；补充时点、反证及来源冲突说明。未接入真实解析服务，未上传材料不得推定不存在。']
  ];
}
