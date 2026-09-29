import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/maps/nanyang');
const counties={
 '411302':15,'411303':19,'411321':21,'411322':19,'411323':19,'411324':22,'411325':16,
 '411326':17,'411327':16,'411328':23,'411329':15,'411330':16,'411381':29,
};
const managementZones={'411371':3,'411372':4};
const overlays={'411302':6,'411303':4,'411322':1};
const expectedLegacyCodes=new Set(['411322107','411322301','411322303','411322309','411322400','411323300','411381316']);
const missingGeometryCode='411322004';

const readJson=async relative=>JSON.parse((await readFile(path.join(root,relative),'utf8')).replace(/^\uFEFF/,''));
const parseCsv=text=>{
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 const headers=lines.shift().split(',');
 return lines.map(line=>Object.fromEntries(line.split(',').map((value,index)=>[headers[index],value])));
};
function validateGeometry(feature,label){
 const geometry=feature?.geometry;
 assert.ok(geometry,`${label}: geometry missing`);
 assert.ok(['Polygon','MultiPolygon'].includes(geometry.type),`${label}: unsupported geometry type ${geometry.type}`);
 assert.ok(Array.isArray(geometry.coordinates)&&geometry.coordinates.length,`${label}: coordinates missing`);
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
 for(const polygon of polygons){
  assert.ok(Array.isArray(polygon)&&polygon.length,`${label}: polygon has no rings`);
  for(const ring of polygon){
   assert.ok(Array.isArray(ring)&&ring.length>=4,`${label}: ring has fewer than four positions`);
   for(const point of ring)assert.ok(Array.isArray(point)&&point.length>=2&&point.slice(0,2).every(Number.isFinite),`${label}: invalid coordinate`);
   assert.deepEqual(ring[0].slice(0,2),ring.at(-1).slice(0,2),`${label}: ring is not closed`);
  }
 }
}
function validateCollection(geo,label){
 assert.equal(geo?.type,'FeatureCollection',`${label}: not a FeatureCollection`);
 assert.ok(Array.isArray(geo.features),`${label}: features must be an array`);
}

try{
 const city=await readJson('city/411300.geojson');
 validateCollection(city,'city/411300.geojson');
 assert.equal(city.features.length,13,'city map must contain exactly 13 county polygons');
 assert.deepEqual(new Set(city.features.map(feature=>String(feature.properties?.adcode))),new Set(Object.keys(counties)),'city county codes mismatch');
 city.features.forEach((feature,index)=>validateGeometry(feature,`city feature ${index}`));

 const legalRegionCodes=new Set(),legalSourceCodes=new Set(),legalFeatures=[];
 for(const [countyCode,expectedCount] of Object.entries(counties)){
  const relative=`townships/${countyCode}.geojson`;
  await access(path.join(root,relative));
  const geo=await readJson(relative);validateCollection(geo,relative);
  assert.equal(geo.features.length,expectedCount,`${countyCode}: polygon count mismatch`);
  for(const feature of geo.features){
   const props=feature.properties||{},regionCode=String(props.regionCode||''),sourceCode=String(props.sourceCode||'');
   assert.equal(String(props.parentCode),countyCode,`${regionCode}: parentCode does not match file name`);
   assert.equal(props.isManagementZone,false,`${regionCode}: legal county feature marked as management zone`);
   assert.ok(regionCode&&!legalRegionCodes.has(regionCode),`${regionCode}: duplicate legal regionCode`);
   assert.ok(sourceCode&&!legalSourceCodes.has(sourceCode),`${sourceCode}: duplicate legal sourceCode`);
   validateGeometry(feature,regionCode);
   legalRegionCodes.add(regionCode);legalSourceCodes.add(sourceCode);legalFeatures.push(feature);
  }
 }
 assert.equal(legalFeatures.length,247,'legal township total must be 247');
 assert.ok(!legalRegionCodes.has(missingGeometryCode),'411322004 广安街道 must not have a fabricated polygon');
 for(const code of expectedLegacyCodes)assert.ok(legalRegionCodes.has(code),`${code}: legacy polygon code was removed or remapped`);

 const zoneRegionCodes=new Set(),zoneSourceCodes=new Set(),zoneFeatures=[];
 for(const [zoneCode,expectedCount] of Object.entries(managementZones)){
  const relative=`management-zones/${zoneCode}.geojson`,geo=await readJson(relative);validateCollection(geo,relative);
  assert.equal(geo.features.length,expectedCount,`${zoneCode}: management-zone count mismatch`);
  for(const feature of geo.features){
   const props=feature.properties||{},regionCode=String(props.regionCode||''),sourceCode=String(props.sourceCode||'');
   assert.equal(String(props.parentCode),zoneCode,`${regionCode}: management-zone parentCode mismatch`);
   assert.equal(props.isManagementZone,true,`${regionCode}: management-zone marker missing`);
   assert.ok(regionCode&&!zoneRegionCodes.has(regionCode),`${regionCode}: duplicate management-zone regionCode`);
   assert.ok(sourceCode&&!zoneSourceCodes.has(sourceCode),`${sourceCode}: duplicate management-zone sourceCode`);
   validateGeometry(feature,regionCode);
   zoneRegionCodes.add(regionCode);zoneSourceCodes.add(sourceCode);zoneFeatures.push(feature);
  }
 }
 assert.equal(zoneFeatures.length,7,'management-zone total must be 7');
 assert.equal(legalFeatures.length+zoneFeatures.length,254,'all source polygons must total 254');

 const repaired=[...legalFeatures,...zoneFeatures].filter(feature=>feature.properties?.geometryRepaired===true);
 assert.equal(repaired.length,5,'geometryRepaired=true total must be 5');
 repaired.forEach(feature=>validateGeometry(feature,`repaired ${feature.properties.regionCode}`));
 const repairLog=parseCsv(await readFile(path.join(root,'metadata/geometry-repair-log.csv'),'utf8'));
 assert.equal(repairLog.length,5,'geometry repair log must contain 5 rows');
 assert.ok(repairLog.every(row=>row.afterValidity==='Valid Geometry'),'repair log contains a geometry not marked valid');
 assert.deepEqual(new Set(repaired.map(feature=>feature.properties.regionCode)),new Set(repairLog.map(row=>row.regionCode)),'repair log and GeoJSON repaired flags differ');

 const legacyRows=parseCsv(await readFile(path.join(root,'metadata/legacy-successor-candidates.csv'),'utf8'));
 assert.deepEqual(new Set(legacyRows.map(row=>row.legacyCode)),expectedLegacyCodes,'legacy candidate list changed unexpectedly');
 assert.ok(legacyRows.every(row=>row.action==='do_not_auto_remap_geometry'),'legacy candidates must remain do_not_auto_remap_geometry');

 const versionDiff=parseCsv(await readFile(path.join(root,'metadata/version-diff-2020-2023.csv'),'utf8'));
 assert.ok(versionDiff.some(row=>row.regionCode===missingGeometryCode&&row.changeType==='added_in_2023'),'2023 广安街道 version difference is missing');
 const manifest=await readJson('metadata/dataset-manifest.json');
 assert.equal(manifest.sourceVersionAssessment,'mixed-legacy~2018-2020','source version assessment mismatch');
 assert.equal(manifest.allGeometryValidAfterRepair,true,'manifest does not confirm all 254 geometries valid after repair');
 assert.equal(manifest.geometryRepairedCount,5,'manifest repair count mismatch');

 for(const [countyCode,expectedCount] of Object.entries(overlays)){
  const relative=`derived-overlays/${countyCode}.management-zones.geojson`,geo=await readJson(relative);validateCollection(geo,relative);
  assert.equal(geo.features.length,expectedCount,`${countyCode}: clipped overlay count mismatch`);
  for(const feature of geo.features){
   const props=feature.properties||{};
   assert.equal(props.renderOnly,true,`${props.regionCode}: overlay must be renderOnly`);
   assert.equal(props.isManagementZone,true,`${props.regionCode}: overlay must remain a management zone`);
   assert.equal(String(props.displayCountyCode),countyCode,`${props.regionCode}: displayCountyCode mismatch`);
   assert.equal(String(props.sourceRegionCode),String(props.parentCode),`${props.regionCode}: original parentCode was not preserved`);
   assert.ok(Object.hasOwn(managementZones,String(props.parentCode)),`${props.regionCode}: overlay parentCode was remapped to a legal county`);
   assert.ok(zoneRegionCodes.has(String(props.regionCode)),`${props.regionCode}: overlay has no source management-zone feature`);
   validateGeometry(feature,`overlay ${countyCode}/${props.regionCode}`);
  }
 }

 await access(path.join(root,'metadata/DATA_NOTICE.md'));
 console.log('Nanyang map data validation PASS');
 console.log(`  city counties: 13`);
 console.log(`  legal township polygons: ${legalFeatures.length}`);
 console.log(`  management-zone polygons: ${zoneFeatures.length}`);
 console.log(`  repaired geometries: ${repaired.length}`);
 console.log(`  clipped overlays: ${Object.values(overlays).reduce((sum,count)=>sum+count,0)} display pieces`);
}catch(error){
 console.error('Nanyang map data validation FAILED');
 console.error(error?.stack||error);
 process.exitCode=1;
}
