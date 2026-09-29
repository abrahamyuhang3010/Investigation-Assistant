export const TIME_RANGES=[
 {id:'7D',label:'最近7天',short:'最近 7天',factor:.085},
 {id:'30D',label:'最近30天',short:'最近 30天',factor:.34},
 {id:'3M',label:'最近3个月',short:'最近 3个月',factor:1},
 {id:'6M',label:'最近半年',short:'最近 半年',factor:1.86},
 {id:'1Y',label:'最近一年',short:'最近 1年',factor:3.54},
 {id:'CUSTOM',label:'自定义',short:'自定义时段',factor:.68},
];

export const CASE_CATEGORIES=[
 {id:'ALL',label:'全部案件',short:'案件',ratio:1,subcategories:[]},
 {id:'TELECOM',label:'电信网络诈骗',short:'电诈案件',ratio:.341,subcategories:[
  {id:'ALL',label:'全部电诈子类',ratio:1},
  {id:'REBATE',label:'刷单返利',ratio:.38},
  {id:'INVESTMENT',label:'虚假投资理财',ratio:.25},
  {id:'IMPERSONATION',label:'冒充公检法',ratio:.18},
  {id:'LOAN',label:'网络贷款',ratio:.12},
 ]},
 {id:'THEFT',label:'盗窃',short:'盗窃案件',ratio:.246,subcategories:[]},
 {id:'FRAUD',label:'传统诈骗',short:'诈骗案件',ratio:.188,subcategories:[]},
 {id:'INJURY',label:'伤害',short:'伤害案件',ratio:.121,subcategories:[]},
 {id:'OTHER',label:'其他',short:'其他案件',ratio:.104,subcategories:[]},
];

export const ALERT_CATEGORIES=[
 {id:'ALL',label:'全部警情',short:'警情',ratio:1},
 {id:'THEFT_ALERT',label:'盗窃类警情',short:'盗窃警情',ratio:.205},
 {id:'DISPUTE',label:'纠纷类警情',short:'纠纷警情',ratio:.187},
 {id:'SECURITY',label:'治安类警情',short:'治安警情',ratio:.168},
 {id:'TRAFFIC',label:'交通类警情',short:'交通警情',ratio:.143},
 {id:'DISASTER',label:'自然灾害类警情',short:'灾害警情',ratio:.074},
];

export const CRIME_METHODS=[
 {id:'ALL',label:'全部作案手段',ratio:1},
 {id:'REBATE',label:'刷单返利',ratio:.207},
 {id:'CHAT',label:'裸聊敲诈',ratio:.126},
 {id:'INVESTMENT',label:'投资理财',ratio:.118},
 {id:'IMPERSONATION',label:'冒充公检法',ratio:.084},
 {id:'LOAN',label:'虚假网络贷款',ratio:.071},
];

import {TOWNSHIP_REGIONS,MANAGEMENT_ZONE_REGIONS,MISSING_GEOMETRY_REGIONS,regionTypeLabel} from './nanyang-region-hierarchy.js';

const cityChildren=[
 ['411302','宛城区','411302',232,482,.147959,true],
 ['411303','卧龙区','411303',200,415,.127551,true],
 ['411381','邓州市','411381',158,328,.100765,true],
 ['411328','唐河县','411328',137,284,.087372,true],
 ['411324','镇平县','411324',126,262,.080357,true],
 ['411329','新野县','411329',116,241,.073980,true],
 ['411323','西峡县','411323',105,218,.066964,true],
 ['411325','内乡县','411325',95,197,.060587,true],
 ['411321','南召县','411321',89,185,.056760,true],
 ['411330','桐柏县','411330',84,174,.053571,true],
 ['411326','淅川县','411326',79,164,.050383,true],
 ['411322','方城县','411322',74,154,.047194,true],
 ['411327','社旗县','411327',73,152,.046556,true],
];
// County totals are the canonical synthetic fixture. Township/street values are allocated
// deterministically below so every real boundary has a complete, internally consistent mock profile.
cityChildren[7][2]='411325';
const city={id:'411300',name:'南阳市',code:'411300',level:'CITY',parentId:'410000',baseCase:1568,baseAlert:3256,allowed:true};
const province={id:'410000',name:'河南省',code:'410000',level:'PROVINCE',parentId:null,baseCase:12640,baseAlert:24820,allowed:true};
const counties=cityChildren.map(([id,name,code,baseCase,baseAlert,weight,allowed],slot)=>({id,name,code,level:'COUNTY',parentId:city.id,baseCase,baseAlert,weight,allowed,slot}));
const townships=[...TOWNSHIP_REGIONS,...MISSING_GEOMETRY_REGIONS].map(item=>({...item,level:'TOWNSHIP',regionTypeLabel:regionTypeLabel(item.regionType),baseCase:null,baseAlert:null,weight:1,allowed:true,hasBusinessData:true,businessDataMode:'synthetic'}));
const managementDisplayCounties={'411371060':['411302','411303'],'411371061':['411303'],'411371401':['411302'],'411372005':['411302'],'411372006':['411302','411303'],'411372007':['411302'],'411372306':['411302','411303','411322']};
const managementZones=MANAGEMENT_ZONE_REGIONS.map(item=>({...item,level:'MANAGEMENT_ZONE',regionTypeLabel:regionTypeLabel(item.regionType),displayCountyCodes:managementDisplayCounties[item.id]||[],baseCase:null,baseAlert:null,weight:1,allowed:true,hasBusinessData:true,businessDataMode:'synthetic-independent'}));
const regions=[province,city,...counties,...townships,...managementZones];
const regionById=new Map(regions.map(region=>[region.id,region]));
const childrenById=new Map();
for(const region of regions){if(!region.parentId||region.isManagementZone)continue;const children=childrenById.get(region.parentId)||[];children.push(region);childrenById.set(region.parentId,children)}

export const defaultGlobalScope=()=>({
 regionId:'411300',regionName:'南阳市',regionLevel:'CITY',timeRange:'3M',dataType:'CASE',
 caseCategory:'ALL',caseSubCategory:'ALL',alertCategory:'ALL',crimeMethod:'ALL',
 customStart:'2026-07-01',customEnd:'2026-09-21',mapZoom:1,mapCenter:null,selectedRegion:null,
});

export const getRegion=id=>regionById.get(id)||city;
export const getChildren=id=>childrenById.get(id)||[];
export function getBreadcrumb(id){
 const result=[];let current=getRegion(id);
 while(current){result.unshift(current);current=current.parentId?regionById.get(current.parentId):null}
 return result.filter(x=>x.level!=='PROVINCE'||x.id==='410000');
}
export function getRegionOptions(){
 // Global Scope intentionally stops at county level: city plus the 13 legal counties.
 // Township and management-zone records remain map selections and never enter this selector.
 return [city,...counties];
}

const hash=text=>[...String(text)].reduce((sum,char)=>sum+char.charCodeAt(0),0);
const number=(value)=>new Intl.NumberFormat('zh-CN').format(value);
const roundTotal=(base,factor,seed)=>Math.max(0,Math.round(base*factor*(.94+(seed%13)/100)));
const timeFor=id=>TIME_RANGES.find(x=>x.id===id)||TIME_RANGES[2];
function resolvedTime(scope){
 const time=timeFor(scope.timeRange);if(scope.timeRange!=='CUSTOM')return time;
 const start=new Date(`${scope.customStart}T00:00:00`),end=new Date(`${scope.customEnd}T00:00:00`);const valid=Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start<=end;
 if(!valid)return time;const days=Math.floor((end-start)/86400000)+1;return {...time,label:`${scope.customStart} 至 ${scope.customEnd}`,short:`${scope.customStart} 至 ${scope.customEnd}`,factor:Math.max(.05,Math.min(4.2,days/92))};
}
const caseCategoryFor=id=>CASE_CATEGORIES.find(x=>x.id===id)||CASE_CATEGORIES[0];
const alertCategoryFor=id=>ALERT_CATEGORIES.find(x=>x.id===id)||ALERT_CATEGORIES[0];
const methodFor=id=>CRIME_METHODS.find(x=>x.id===id)||CRIME_METHODS[0];

function metricFactor(scope){
 const time=resolvedTime(scope);let factor=time.factor;
 if(scope.dataType==='CASE'){
  const category=caseCategoryFor(scope.caseCategory);factor*=category.ratio;
  if(scope.caseSubCategory!=='ALL')factor*=category.subcategories.find(x=>x.id===scope.caseSubCategory)?.ratio||1;
  if(scope.crimeMethod!=='ALL'&&scope.crimeMethod!==scope.caseSubCategory)factor*=methodFor(scope.crimeMethod).ratio;
 }else factor*=alertCategoryFor(scope.alertCategory).ratio;
 return factor;
}

/** Largest-remainder allocation: nonnegative, integer, exact parent/child sums. */
function allocate(total, weights) {
 const sum=weights.reduce((a,b)=>a+b,0);
 if(!sum)return weights.map(()=>0);
 const exact=weights.map(w=>total*w/sum), values=exact.map(Math.floor);
 const order=exact.map((n,i)=>({i,remainder:n-values[i]})).sort((a,b)=>b.remainder-a.remainder);
 for(let left=total-values.reduce((a,b)=>a+b,0),i=0;i<left;i++)values[order[i%order.length].i]++;
 return values;
}
function distribute(total,ratios,labels){const values=allocate(total,ratios);return labels.map((label,i)=>({label,value:values[i]}))}
// Only active filters affect the query identity; remembered inactive values do not.
const filterSeed=scope=>hash([scope.timeRange,...(scope.timeRange==='CUSTOM'?[scope.customStart,scope.customEnd]:[]),scope.dataType,...(scope.dataType==='CASE'?[scope.caseCategory,scope.caseSubCategory,scope.crimeMethod]:[scope.alertCategory])].join('-'));

/** A canonical synthetic RegionMetric for every selectable map region. */
export function getRegionMetrics(inputScope){
 const scope={...defaultGlobalScope(),...inputScope},seed=filterSeed(scope);
 const total=roundTotal(scope.dataType==='CASE'?city.baseCase:city.baseAlert,metricFactor(scope),seed);
 const result=new Map(),category=scope.dataType==='CASE'?caseCategoryFor(scope.caseCategory):alertCategoryFor(scope.alertCategory);
 const typeWeight={street:1.22,town:1.08,township:.92,ethnic_township:.9,farm:.72,forestFarm:.68,managementArea:.82,industrialPark:1.12,other:.8};
 function metricFor(region,count){
  return {...region,adcode:region.code,count,hasBusinessData:true,businessDataMode:region.businessDataMode||'synthetic',comparison:((seed+hash(region.id))%97-32)/10,topCategory:category.id==='ALL'?(scope.dataType==='CASE'?CASE_CATEGORIES[1].label:ALERT_CATEGORIES[1].label):category.label,topMethod:methodFor(scope.crimeMethod==='ALL'?'REBATE':scope.crimeMethod).label};
 }
 function visit(region,count){
  result.set(region.id,metricFor(region,count));
  const childLevel=region.level==='CITY'?'COUNTY':region.level==='COUNTY'?'TOWNSHIP':null;
  if(!childLevel)return;
  const children=getChildren(region.id).filter(item=>item.level===childLevel);
  const counts=allocate(count,children.map((r,i)=>(r.weight||1)*(typeWeight[r.regionType]||1)*(.8+((seed+hash(r.id)*7+i)%41)/100)));
  children.forEach((child,i)=>visit(child,counts[i]));
 }
 visit(city,total);
 // Management-zone polygons overlap legal counties, so their synthetic metrics are intentionally
 // independent display metrics and are never included in the legal city/county roll-up.
 for(const zone of managementZones){
  const hosts=zone.displayCountyCodes.map(id=>result.get(id)?.count||0).filter(Boolean);
  const hostAverage=hosts.length?hosts.reduce((sum,value)=>sum+value,0)/hosts.length:total/13;
  const count=Math.max(0,Math.round(hostAverage*(.055+((seed+hash(zone.id))%31)/1000)));
  result.set(zone.id,metricFor(zone,count));
 }
 return result;
}
function trend(total,scope){
 const time=resolvedTime(scope),end=new Date(`${scope.timeRange==='CUSTOM'?scope.customEnd:'2026-09-21'}T12:00:00Z`);
 const days=scope.timeRange==='CUSTOM'?Math.round(time.factor*92):({'7D':7,'30D':30,'3M':92,'6M':183,'1Y':365}[scope.timeRange]||92);
 const n=Math.min(days,12),seed=filterSeed(scope);
 const values=allocate(total,Array.from({length:n},(_,i)=>.7+((seed+i*7)%17)/20));
 return values.map((value,i)=>{const date=new Date(end.getTime()-(n-1-i)*days/n*86400000);return {label:date.toISOString().slice(5,10),value}});
}
function categoryCards(scope,regionId){
 const source=scope.dataType==='CASE'?CASE_CATEGORIES:ALERT_CATEGORIES;
 return source.slice(1,5).map(item=>({id:item.id,label:item.label,
  value:getRegionMetrics({...scope,...(scope.dataType==='CASE'?{caseCategory:item.id,caseSubCategory:'ALL',crimeMethod:'ALL'}:{alertCategory:item.id})}).get(regionId)?.count||0,
  active:(scope.dataType==='CASE'?scope.caseCategory:scope.alertCategory)===item.id}));
}

function noBusinessView(scope,region){
 const category=scope.dataType==='CASE'?caseCategoryFor(scope.caseCategory):alertCategoryFor(scope.alertCategory);
 return {scope,region,metric:{...region,count:null,hasBusinessData:false,comparison:null},total:null,totalText:'—',trend:[],categoryCards:[],regions:[],time:resolvedTime(scope),category,hasBusinessData:false,victim:{total:null,totalText:'—',change:null,gender:[],age:[],occupations:[],methods:[],unknownOccupation:null},alerts:{typeDistribution:[],hours:[],addresses:[],repeated:null,repeatedRate:null},top:{age:'',occupation:'',gender:'',method:''},updatedAt:'2026-09-21 09:36',partial:false,completeness:{occupation:'unavailable'}};
}
export function getSituationView(inputScope, metrics, contextRegionId){
 const scope={...defaultGlobalScope(),...inputScope};metrics=metrics||getRegionMetrics(scope);
 const region=getRegion(contextRegionId||scope.regionId);
 const metric=metrics.get(region.id)||metrics.get(city.id),total=metric.count,seed=filterSeed(scope)+hash(region.id);
 const victimTotal=scope.dataType==='CASE'?Math.round(total*(.88+(seed%7)/100)):0;
 const male=.58+(seed%8)/100,gender=distribute(victimTotal,[male,1-male],['男性','女性']);
 const age=distribute(victimTotal,[.08,.32+(seed%7)/100,.26,.16,.1,.06],['20岁以下','20～30岁','30～40岁','40～50岁','50～60岁','60岁以上']);
 const occupationAll=distribute(victimTotal,[.27,.19,.17,.14,.11,.12],['自由职业','学生','企业职员','个体经营','技术人员','其他 / 未知']),occupations=occupationAll.slice(0,5);
 const methods=CRIME_METHODS.slice(1).map(item=>({id:item.id,label:item.label,value:scope.crimeMethod==='ALL'?getRegionMetrics({...scope,crimeMethod:item.id}).get(region.id)?.count||0:scope.crimeMethod===item.id?total:0,active:scope.crimeMethod===item.id})).sort((a,b)=>b.value-a.value);
 const childLevel=region.level==='CITY'?'COUNTY':'TOWNSHIP';
 const regions=getChildren(region.id).filter(child=>child.level===childLevel).map(child=>metrics.get(child.id)||child).sort((a,b)=>(b.count||0)-(a.count||0)||a.code.localeCompare(b.code));
 const time=resolvedTime(scope),category=scope.dataType==='CASE'?caseCategoryFor(scope.caseCategory):alertCategoryFor(scope.alertCategory),topAge=age.reduce((a,b)=>a.value>=b.value?a:b),topGender=gender.reduce((a,b)=>a.value>=b.value?a:b),topMethod=methods.reduce((a,b)=>a.value>=b.value?a:b),repeated=Math.round(total*(.087+(seed%24)/1000));
 const alerts={typeDistribution:category.id==='ALL'?distribute(total,[.205,.187,.168,.143,.074,.223],['盗窃','纠纷','治安','交通','自然灾害','其他']):[{label:category.label,value:total}],hours:distribute(total,[.23,.19,.16,.14,.28],['18:00–21:00','09:00–12:00','21:00–24:00','14:00–17:00','其他时段']),addresses:distribute(total,[.34,.27,.21,.18],[`${region.name}中心片区`,`${region.name}东部片区`,`${region.name}西部片区`,'其他区域']),repeated,repeatedRate:total?repeated/total*100:0};
 return {scope,region,metric,total,totalText:number(total),trend:trend(total,scope),categoryCards:categoryCards(scope,region.id),regions,time,category,hasBusinessData:true,victim:{total:victimTotal,totalText:number(victimTotal),change:metric.comparison,gender,age,occupations,methods,unknownOccupation:occupationAll[5].value},alerts,top:{age:topAge.label,occupation:occupations[0].label,gender:topGender.label,method:topMethod.label},updatedAt:'2026-09-21 09:36',partial:region.id==='411303',completeness:{occupation:region.id==='411303'?'delayed':'available'}};
}
export function getSituationSnapshot(scope){
 const metrics=getRegionMetrics(scope),view=getSituationView(scope,metrics),candidate=scope.selectedRegion?getRegion(scope.selectedRegion):null;
 const selected=candidate?.id===scope.selectedRegion&&candidate.allowed!==false?candidate:null;
 return {view,context:selected?getSituationView(scope,metrics,selected.id):view,metrics};
}
export function getSubcategoryOptions(scope){return caseCategoryFor(scope.caseCategory).subcategories}
export function formatNumber(value){return number(value)}
