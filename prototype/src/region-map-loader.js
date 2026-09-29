const CITY_CODE='411300';
const COUNTY_CODES=['411302','411303','411321','411322','411323','411324','411325','411326','411327','411328','411329','411330','411381'];
const OVERLAY_COUNTIES=new Set(['411302','411303','411322']);
const citySource=new URL('../assets/maps/nanyang/city/411300.geojson',import.meta.url);
const townshipSource=code=>new URL(`../assets/maps/nanyang/townships/${code}.geojson`,import.meta.url);
const overlaySource=code=>new URL(`../assets/maps/nanyang/derived-overlays/${code}.management-zones.geojson`,import.meta.url);
const cache=new Map();
const asCode=value=>String(value??'');
function validateGeometry(feature){
 const type=feature?.geometry?.type, coordinates=feature?.geometry?.coordinates;
 if(!['Polygon','MultiPolygon'].includes(type)||!Array.isArray(coordinates)||!coordinates.length)throw new Error('行政区几何无效');
 const polygons=type==='Polygon'?[coordinates]:coordinates;
 for(const polygon of polygons)for(const ring of polygon){
  if(!Array.isArray(ring)||ring.length<4||ring.some(point=>!Array.isArray(point)||point.length<2||!point.slice(0,2).every(Number.isFinite)))throw new Error('行政区坐标无效');
 }
}
async function fetchJson(url,label){
 let response;
 try{
  // Region promises already provide the session cache. Avoid force-cache here: a stale
  // negative CDN/browser entry made newly deployed county assets fail repeatedly.
  response=await fetch(url.href,{cache:'no-store',headers:{Accept:'application/geo+json, application/json'}});
 }catch(cause){throw new Error(`${label}网络请求失败，请检查静态资源是否已完整发布`,{cause})}
 if(!response.ok)throw new Error(`${label}加载失败（HTTP ${response.status}）`);
 try{return await response.json()}catch(cause){throw new Error(`${label}不是有效的 GeoJSON`,{cause})}
}
function validateCollection(geo,kind,code){
 if(geo?.type!=='FeatureCollection'||!Array.isArray(geo.features))throw new Error('GeoJSON 必须是 FeatureCollection');
 if(kind==='city'){
  const codes=geo.features.map(f=>asCode(f.properties?.adcode));
  if(codes.length!==13||new Set(codes).size!==13||COUNTY_CODES.some(item=>!codes.includes(item)))throw new Error('南阳市行政区数据校验失败：需要13个唯一行政代码');
  geo.features.forEach(validateGeometry);
 }else{
  geo.features.forEach(feature=>{
   const props=feature.properties||{};
   if(!props.regionCode||((kind==='overlay'?asCode(props.displayCountyCode):asCode(props.parentCode))!==code))throw new Error(`乡级数据父级代码校验失败：${code}`);
   if(kind==='townships'&&props.isManagementZone===true)throw new Error(`法定乡级数据包含功能区：${props.regionCode}`);
   if(kind==='overlay'&&props.isManagementZone!==true)throw new Error(`功能区覆盖层标记缺失：${props.regionCode}`);
   validateGeometry(feature);
  });
 }
 return geo;
}
function mergedCollection(code,legal,overlay){
 const features=[...legal.features,...(overlay?.features||[])];
 return {type:'FeatureCollection',name:`nanyang-${code}`,features};
}
export async function loadRegionMap(regionCode){
 const code=asCode(regionCode);
 if(cache.has(code))return cache.get(code);
 const pending=(async()=>{
  if(code===CITY_CODE){
   const geo=validateCollection(await fetchJson(citySource,'南阳市级地图'),'city',code);
   return {regionCode:code,mapName:`nanyang-${code}`,geo,legalFeatureCount:geo.features.length,overlayFeatureCount:0};
  }
  if(!COUNTY_CODES.includes(code))throw new Error(`未支持的地图辖区：${code}`);
  const legal=validateCollection(await fetchJson(townshipSource(code),`${code} 乡镇 / 街道地图`),'townships',code);
  let overlay=null;
  if(OVERLAY_COUNTIES.has(code))overlay=validateCollection(await fetchJson(overlaySource(code),`${code} 功能区覆盖层`),'overlay',code);
  const geo=mergedCollection(code,legal,overlay);
  return {regionCode:code,mapName:`nanyang-${code}`,geo,legalFeatureCount:legal.features.length,overlayFeatureCount:overlay?.features.length||0};
 })();
 cache.set(code,pending);
 try{return await pending}catch(error){cache.delete(code);throw error}
}
export function clearRegionMapCache(regionCode){if(regionCode)cache.delete(asCode(regionCode));else cache.clear()}
export function getRegionMapCacheSize(){return cache.size}
export {CITY_CODE,COUNTY_CODES,OVERLAY_COUNTIES};
