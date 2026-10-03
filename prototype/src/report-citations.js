const ref=(sourceId,options={})=>({sourceId,...options});
const existing=(d,refs)=>refs.filter(item=>d.sources.some(source=>source.id===item.sourceId));
const sourceVersion=(sources,id)=>sources.find(source=>source.id===id)?.version??'未提供';

export function buildReportCitations({caseId,reportId,detail,sections}){
  const d=detail,account=d.account||[],sources=d.sources||[];
  const all=sources.map(source=>ref(source.id));
  const byKey={
    '0:0':existing(d,[ref('original',{page:1,quote:d.victim?`${d.victim}反映其通过`:undefined})]),
    '1:0':all,
    '1:1':[],
    '2:0':existing(d,[ref('original',{page:1,quote:account[4]?`材料记载收款账户尾号${account[4]}`:undefined})]),
    '2:1':existing(d,[ref('original',{page:1,quote:account[4]?`材料记载收款账户尾号${account[4]}`:undefined}),ref('transcript-1',{page:2,quote:account[4]?`已提供尾号${account[2]}、${account[4]}的合成记录。`:undefined})]),
    '2:2':existing(d,[ref('forensic-1'),ref('forensic-2')]),
    '3:0':existing(d,[ref('original',{page:1}),ref('forensic-1',{page:1}),ref('forensic-2',{page:1}),ref('transcript-1',{page:2})]),
    '3:1':[],
    '4:0':existing(d,[ref('original',{page:1,quote:d.network?`账号 ${d.network}`:undefined}),ref('forensic-1',{page:1,quote:d.network?`账号${d.network}`:undefined}),ref('transcript-2',{page:1,quote:d.network?`账号${d.network}`:undefined})]),
    '4:1':existing(d,[ref('transcript-2')]),
    '5:0':[],
    '6:0':[],
  };
  return sections.flatMap((paragraphs,section)=>paragraphs.map((text,paragraph)=>{
    const id=`C${section+1}-${paragraph+1}`;
    return {
      id,caseId,reportId,section,paragraph,text,demo:true,
      sources:(byKey[`${section}:${paragraph}`]||[]).map(item=>({...item,sourceVersion:sourceVersion(sources,item.sourceId)})),
    };
  }));
}

export const citationsForSection=(citations,section)=>(citations||[]).filter(citation=>citation.section===section);

export function citationLocatorLabel(ref){
  const parts=[];
  if(Number.isInteger(ref?.page))parts.push(`第 ${ref.page} 页`);
  if(Number.isInteger(ref?.paragraph))parts.push(`第 ${ref.paragraph} 段`);
  if(Number.isInteger(ref?.line))parts.push(`第 ${ref.line} 行`);
  return parts.length?parts.join(' · '):'未提供精确定位';
}

export function resolveCitation(citation,sources,selectedSourceId){
  if(!citation)return {status:'invalid',message:'引用失效：当前报告中找不到该引用。'};
  if(!citation.sources?.length)return {status:'no-source',citation,message:'该段没有来源引用；这是报告说明或研判性文本。'};
  const selectedRef=citation.sources.find(item=>item.sourceId===selectedSourceId)||citation.sources[0];
  const source=sources.find(item=>item.id===selectedRef.sourceId);
  if(!source)return {status:'unavailable',citation,ref:selectedRef,message:`材料不可用：来源 ${selectedRef.sourceId} 不在当前${citation.reportId?.startsWith('draft-')?'材料集合':'报告冻结快照'}中。`};
  if(source.restricted||source.available===false)return {status:'unavailable',citation,ref:selectedRef,source,message:'材料不可用：当前演示身份无权查看原文，未展示受限内容。'};
  const pages=Array.isArray(source.pages)?source.pages:String(source.text||'').split(/\n\n+/);
  if(Number.isInteger(selectedRef.page)&&(selectedRef.page<1||selectedRef.page>pages.length))return {status:'invalid',citation,ref:selectedRef,source,pages,message:'引用失效：记录的页码不在材料快照范围内。'};
  const page=Number.isInteger(selectedRef.page)?selectedRef.page:1;
  const text=Number.isInteger(selectedRef.page)?pages[page-1]??'':pages.join('\n\n');
  if(selectedRef.quote&&!text.includes(selectedRef.quote))return {status:'invalid',citation,ref:selectedRef,source,pages,page,text,message:'引用失效：材料仍存在，但精确引用内容与当前快照不匹配。'};
  return {status:'ready',citation,ref:selectedRef,source,pages,page,text,precise:Boolean(selectedRef.page||selectedRef.paragraph||selectedRef.line||selectedRef.quote),locator:citationLocatorLabel(selectedRef)};
}
