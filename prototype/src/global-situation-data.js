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
 ['411330','桐柏县','411330',84,174,.053571,false],
 ['411326','淅川县','411326',79,164,.050383,true],
 ['411322','方城县','411322',74,154,.047194,true],
 ['411327','社旗县','411327',73,152,.046556,true],
];

const streetNames={
 '411302':['仲景街道','新华街道','东关街道','汉冶街道','白河街道','瓦店镇'],
 '411303':['七一街道','卧龙岗街道','梅溪街道','车站街道','靳岗街道','蒲山镇'],
 '411381':['古城街道','花洲街道','湍河街道','罗庄镇','张村镇','穰东镇'],
 '411328':['滨河街道','文峰街道','兴唐街道','源潭镇','桐寨铺镇','郭滩镇'],
 '411324':['涅阳街道','雪枫街道','玉都街道','石佛寺镇','贾宋镇','晁陂镇'],
 '411329':['汉城街道','汉华街道','城郊乡','沙堰镇','施庵镇','新甸铺镇'],
 '411323':['白羽街道','紫金街道','莲花街道','丹水镇','五里桥镇','回车镇'],
 '411325':['城关镇','湍东镇','赤眉镇','马山口镇','灌涨镇','王店镇'],
 '411321':['城关镇','留山镇','云阳镇','皇路店镇','南河店镇','板山坪镇'],
 '411330':['城关镇','月河镇','吴城镇','毛集镇','淮源镇','平氏镇'],
 '411326':['龙城街道','商圣街道','荆紫关镇','香花镇','厚坡镇','九重镇'],
 '411322':['凤瑞街道','释之街道','赭阳街道','博望镇','独树镇','广阳镇'],
 '411327':['赊店镇','潘河街道','赵河街道','桥头镇','晋庄镇','陌陂镇'],
};
const childWeights=[.23,.19,.17,.15,.14,.12];

function makeStreetChildren(parent){
 return streetNames[parent.id].map((name,index)=>({
  id:`${parent.id}-${index+1}`,name,code:`${parent.code}${String(index+1).padStart(3,'0')}`,
  level:'STREET',parentId:parent.id,baseCase:Math.round(parent.baseCase*childWeights[index]),
  baseAlert:Math.round(parent.baseAlert*childWeights[index]),weight:childWeights[index],allowed:true,slot:index,
 }));
}

const city={id:'411300',name:'南阳市',code:'411300',level:'CITY',parentId:'410000',baseCase:1568,baseAlert:3256,allowed:true};
const province={id:'410000',name:'河南省',code:'410000',level:'PROVINCE',parentId:null,baseCase:12640,baseAlert:24820,allowed:true};
const counties=cityChildren.map(([id,name,code,baseCase,baseAlert,weight,allowed],slot)=>({id,name,code,level:'COUNTY',parentId:city.id,baseCase,baseAlert,weight,allowed,slot}));
const streets=counties.flatMap(makeStreetChildren);
const regions=[province,city,...counties,...streets];
const regionById=new Map(regions.map(region=>[region.id,region]));
const childrenById=new Map();
for(const region of regions){if(!region.parentId)continue;const children=childrenById.get(region.parentId)||[];children.push(region);childrenById.set(region.parentId,children)}

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
export function getRegionOptions(scope){
 const current=getRegion(scope.regionId);const parent=current.parentId?getRegion(current.parentId):null;
 const ancestors=getBreadcrumb(current.id).filter(item=>item.level!=='PROVINCE');const siblings=parent?getChildren(parent.id):[current];
 return [...ancestors,...siblings,...getChildren(current.id)].filter((item,index,array)=>array.findIndex(x=>x.id===item.id)===index);
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

/** A canonical RegionMetric per adcode. Selection/zoom/collapse never change metrics. */
export function getRegionMetrics(inputScope){
 const scope={...defaultGlobalScope(),...inputScope},seed=filterSeed(scope);
 const total=roundTotal(scope.dataType==='CASE'?city.baseCase:city.baseAlert,metricFactor(scope),seed);
 const result=new Map();
 const category=scope.dataType==='CASE'?caseCategoryFor(scope.caseCategory):alertCategoryFor(scope.alertCategory);
 function visit(region,count){
  const children=getChildren(region.id);
  const metric={...region,adcode:region.code,count,comparison:((seed+hash(region.id))%97-32)/10,
   topCategory:category.id==='ALL'?(scope.dataType==='CASE'?CASE_CATEGORIES[1].label:ALERT_CATEGORIES[1].label):category.label,
   topMethod:methodFor(scope.crimeMethod==='ALL'?'REBATE':scope.crimeMethod).label};
  result.set(region.id,metric);
  const counts=allocate(count,children.map((r,i)=>(r.weight||1)*(.8+((seed+hash(r.id)*7+i)%41)/100)));
  children.forEach((child,i)=>visit(child,counts[i]));
 }
 visit(city,total);return result;
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

export function getSituationView(inputScope, metrics, contextRegionId){
 const scope={...defaultGlobalScope(),...inputScope};metrics=metrics||getRegionMetrics(scope);
 const region=getRegion(contextRegionId||scope.regionId),metric=metrics.get(region.id)||metrics.get(city.id);
 const total=metric.count,seed=filterSeed(scope)+hash(region.id);
 const victimTotal=scope.dataType==='CASE'?Math.round(total*(.88+(seed%7)/100)):0;
 const male=.58+(seed%8)/100,gender=distribute(victimTotal,[male,1-male],['男性','女性']);
 const ageWeights=[.08,.32+(seed%7)/100,.26,.16,.1,.06];
 const age=distribute(victimTotal,ageWeights,['20岁以下','20～30岁','30～40岁','40～50岁','50～60岁','60岁以上']);
 const occupationLabels=['自由职业','学生','企业职员','个体经营','技术人员','其他 / 未知'];
 const occupationAll=distribute(victimTotal,[.27,.19,.17,.14,.11,.12],occupationLabels);
 const occupations=occupationAll.slice(0,5);
 const methods=CRIME_METHODS.slice(1).map(item=>({id:item.id,label:item.label,
  value:scope.crimeMethod==='ALL'?getRegionMetrics({...scope,crimeMethod:item.id}).get(region.id)?.count||0:scope.crimeMethod===item.id?total:0,
  active:scope.crimeMethod===item.id})).sort((a,b)=>b.value-a.value);
 const regions=getChildren(region.id).map(child=>metrics.get(child.id)).filter(Boolean).sort((a,b)=>b.count-a.count);
 const time=resolvedTime(scope),category=scope.dataType==='CASE'?caseCategoryFor(scope.caseCategory):alertCategoryFor(scope.alertCategory);
 const topAge=age.reduce((a,b)=>a.value>=b.value?a:b),topGender=gender.reduce((a,b)=>a.value>=b.value?a:b);
 const topMethod=methods.reduce((a,b)=>a.value>=b.value?a:b);
 const repeated=Math.round(total*(.087+(seed%24)/1000));
 const alerts={
  typeDistribution:category.id==='ALL'?distribute(total,[.205,.187,.168,.143,.074,.223],['盗窃','纠纷','治安','交通','自然灾害','其他']):[{label:category.label,value:total}],
  hours:distribute(total,[.23,.19,.16,.14,.28],['18:00–21:00','09:00–12:00','21:00–24:00','14:00–17:00','其他时段']),
  addresses:regions.slice(0,5).map(item=>({label:item.name,value:item.count})),
  repeated,repeatedRate:total?repeated/total*100:0,
 };
 return {scope,region,metric,total,totalText:number(total),trend:trend(total,scope),categoryCards:categoryCards(scope,region.id),regions,time,category,
  victim:{total:victimTotal,totalText:number(victimTotal),change:metric.comparison,gender,age,occupations,methods,unknownOccupation:occupationAll[5].value},alerts,
  top:{age:topAge.label,occupation:occupations[0].label,gender:topGender.label,method:topMethod.label},
  updatedAt:'2026-09-21 09:36',partial:region.id==='411303',completeness:{occupation:region.id==='411303'?'delayed':'available'}};
}
export function getSituationSnapshot(scope){
 const metrics=getRegionMetrics(scope),view=getSituationView(scope,metrics);
 const selected=view.regions.find(r=>r.id===scope.selectedRegion&&r.allowed!==false);
 return {view,context:selected?getSituationView(scope,metrics,selected.id):view,metrics};
}
export function getSubcategoryOptions(scope){return caseCategoryFor(scope.caseCategory).subcategories}
export function formatNumber(value){return number(value)}
