export const CASE_IMPORT_LIMIT = 50;

export const CASE_IMPORT_FIELDS = [
  {key:'name',label:'案件名称',required:true,maxLength:100,description:'本地案件引用的显示名称'},
  {key:'number',label:'案件编号',required:true,maxLength:60,description:'必须使用 JSON 字符串；保留前导零，批次内及现有列表不可重复'},
  {key:'owner',label:'立案单位',required:false,maxLength:80,description:'未提供时使用“示例一组”'},
  {key:'caseType',label:'案件类型',required:false,options:['投资平台诈骗','关联账户核查','其他类型'],description:'未提供时使用“其他类型”'},
  {key:'clueCategory',label:'线索类别',required:false,options:['涉网线索','资金线索','其他线索'],description:'未提供时使用“其他线索”'},
  {key:'caseStatus',label:'案件状态',required:false,options:['待确认','已立案','侦办中','已结案'],description:'未提供时使用“待确认”'},
  {key:'analysisStatus',label:'研判状态',required:false,options:['待研判','研判中','待核验','待补充','已完成'],description:'未提供时使用“待研判”'},
  {key:'acceptedAt',label:'受理时间',required:false,description:'YYYY-MM-DD 或 YYYY-MM-DD HH:mm；不做时区换算'},
  {key:'filedAt',label:'立案时间',required:false,description:'YYYY-MM-DD 或 YYYY-MM-DD HH:mm；可留空'},
  {key:'description',label:'简要案情',required:false,maxLength:1000,description:'仅保存输入原文，不自动提取实体'},
];

export const CASE_IMPORT_TEMPLATE = [{
  name:'批量导入合成示例案件',
  number:'00012345678901234567',
  owner:'示例分局 · 刑侦大队',
  caseType:'投资平台诈骗',
  clueCategory:'涉网线索',
  caseStatus:'待确认',
  analysisStatus:'待研判',
  acceptedAt:'2026-10-03 09:30',
  filedAt:'',
  description:'用于验证模板往返与字符串编号前导零保留。',
}];

export const caseImportTemplateText=()=>JSON.stringify(CASE_IMPORT_TEMPLATE,null,2);

function jsonLocation(message,text){
  const direct=String(message).match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if(direct)return {line:Number(direct[1]),column:Number(direct[2])};
  const position=String(message).match(/position\s+(\d+)/i);
  if(!position)return null;
  const offset=Math.max(0,Math.min(Number(position[1]),text.length));
  const before=text.slice(0,offset),lines=before.split('\n');
  return {line:lines.length,column:lines.at(-1).length+1};
}

export function parseCaseImportJson(text){
  const raw=String(text??'');
  try{return {ok:true,value:JSON.parse(raw),errors:[]};}
  catch(error){
    const location=jsonLocation(error.message,raw);
    return {ok:false,value:null,errors:[{code:'json-syntax',message:`JSON 语法错误${location?`（第 ${location.line} 行，第 ${location.column} 列）`:''}：${error.message}`} ]};
  }
}

const isValidLocalDate=value=>{
  if(value==='')return true;
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?: ([01]\d|2[0-3]):([0-5]\d))?$/);
  if(!match)return false;
  const [,year,month,day]=match,date=new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));
  return date.getUTCFullYear()===Number(year)&&date.getUTCMonth()===Number(month)-1&&date.getUTCDate()===Number(day);
};
const fieldError=(index,field,message)=>({code:'field',index,field,message:`第 ${index+1} 条 · ${field}：${message}`});

export function validateCaseImportRows(value,existingNumbers=[]){
  const errors=[];
  if(!Array.isArray(value))return {ok:false,rows:[],errors:[{code:'root',message:'根节点必须是 JSON 数组。'}]};
  if(value.length===0)return {ok:false,rows:[],errors:[{code:'empty',message:'数组不能为空；本次未导入任何案件。'}]};
  if(value.length>CASE_IMPORT_LIMIT)return {ok:false,rows:[],errors:[{code:'limit',message:`单批最多 ${CASE_IMPORT_LIMIT} 条；当前 ${value.length} 条，整批未导入。`}]};
  const supported=new Set(CASE_IMPORT_FIELDS.map(field=>field.key));
  const seen=new Set([...existingNumbers].map(number=>String(number)));
  const rows=[];
  value.forEach((input,index)=>{
    if(!input||typeof input!=='object'||Array.isArray(input)){errors.push({code:'record',index,message:`第 ${index+1} 条：必须是 JSON 对象。`});return;}
    const unknown=Object.keys(input).filter(key=>!supported.has(key));
    unknown.forEach(key=>errors.push(fieldError(index,key,'当前批量导入不支持该字段，未静默丢弃。')));
    const row={};
    for(const spec of CASE_IMPORT_FIELDS){
      const value=input[spec.key];
      if(value===undefined){if(spec.required)errors.push(fieldError(index,`${spec.label}（${spec.key}）`,'缺少必填字段。'));continue;}
      if(typeof value!=='string'){errors.push(fieldError(index,`${spec.label}（${spec.key}）`,'必须是字符串；编号等标识不可使用数字类型。'));continue;}
      const normalized=value.trim();
      if(spec.required&&!normalized){errors.push(fieldError(index,`${spec.label}（${spec.key}）`,'不能为空。'));continue;}
      if(spec.maxLength&&normalized.length>spec.maxLength){errors.push(fieldError(index,`${spec.label}（${spec.key}）`,`不能超过 ${spec.maxLength} 个字符。`));continue;}
      if(spec.options&&normalized&&!spec.options.includes(normalized)){errors.push(fieldError(index,`${spec.label}（${spec.key}）`,`仅支持：${spec.options.join('、')}。`));continue;}
      if(['acceptedAt','filedAt'].includes(spec.key)&&!isValidLocalDate(normalized)){errors.push(fieldError(index,`${spec.label}（${spec.key}）`,'格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm，且日期真实存在。'));continue;}
      row[spec.key]=normalized;
    }
    if(typeof input.number==='string'&&input.number.trim()){
      const number=input.number.trim();
      if(seen.has(number))errors.push(fieldError(index,'案件编号（number）',`编号“${number}”与现有案件或本批次重复。`));
      else seen.add(number);
    }
    rows.push(row);
  });
  return {ok:errors.length===0,rows,errors};
}

export function prepareCaseImport(text,existingNumbers=[]){
  const parsed=parseCaseImportJson(text);
  if(!parsed.ok)return {...parsed,rows:[]};
  return validateCaseImportRows(parsed.value,existingNumbers);
}

export function caseRecordFromImport(row,{id,user,date}){
  const acceptedAt=row.acceptedAt||`${date} 09:30`;
  return {
    id,
    name:row.name,
    number:row.number,
    owner:row.owner||'示例一组',
    caseType:row.caseType||'其他类型',
    clueCategory:row.clueCategory||'其他线索',
    analysisStatus:row.analysisStatus||'待研判',
    caseStatus:row.caseStatus||'待确认',
    category:row.clueCategory||'其他线索',
    status:row.analysisStatus||'待研判',
    acceptedAt,
    filedAt:row.filedAt||'',
    acceptingUnit:row.owner||'示例一组',
    description:row.description||'—',
    victim:'—',suspect:'—',updated:date,members:[user],reports:[],
  };
}
