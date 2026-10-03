import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  CASE_IMPORT_LIMIT,
  CASE_IMPORT_TEMPLATE,
  caseImportTemplateText,
  parseCaseImportJson,
  validateCaseImportRows,
  prepareCaseImport,
  caseRecordFromImport,
} from '../src/case-import.js';
import {
  buildReportCitations,
  citationLocatorLabel,
  resolveCitation,
} from '../src/report-citations.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'docs/design-audit-2026-10-02/evidence/prompt-06');
await fs.mkdir(output,{recursive:true});
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const results=[];
const runtimeErrors=[];

async function record(id,name,fn){
  try{await fn();results.push({id,name,status:'PASS'});console.log(`PASS ${id} ${name}`);}
  catch(error){results.push({id,name,status:'FAIL',error:error.stack});console.error(`FAIL ${id} ${name}\n${error.stack}`);}
}

await record('P06-R24-LOGIC','批量导入模板、校验、阻断与字符串编号',async()=>{
  const templateText=caseImportTemplateText();
  const parsed=parseCaseImportJson(templateText);
  assert.equal(parsed.ok,true);
  assert.deepEqual(parsed.value,CASE_IMPORT_TEMPLATE);
  assert.equal(parsed.value[0].number,'00012345678901234567');

  const valid=prepareCaseImport(JSON.stringify([{name:'长编号案件',number:'000000000000000000123456789',acceptedAt:'2026-10-03 09:30',filedAt:'2026-10-03'}]));
  assert.equal(valid.ok,true);
  assert.equal(valid.rows[0].number,'000000000000000000123456789');
  const record=caseRecordFromImport(valid.rows[0],{id:'CASE-P06',user:'验收人员',date:'2026-10-03'});
  assert.equal(record.number,'000000000000000000123456789');
  assert.equal(typeof record.number,'string');

  const syntax=parseCaseImportJson('[\n  {"name":"语法错误",\n]');
  assert.equal(syntax.ok,false);
  assert.match(syntax.errors[0].message,/JSON 语法错误/);

  for(const [value,pattern] of [
    [[{number:'MISSING-NAME'}],/name|案件名称|必填/],
    [[{name:'缺编号'}],/number|案件编号|必填/],
    [[{name:'数字编号',number:12345678901234567890}],/必须是字符串/],
    [[{name:'现有重复',number:'A2026-0912'}],/重复/],
    [[{name:'批次一',number:'P06-DUP'},{name:'批次二',number:'P06-DUP'}],/重复/],
    [[],/数组不能为空/],
    [Array.from({length:CASE_IMPORT_LIMIT+1},(_,i)=>({name:`超限${i}`,number:`P06-${i}`})),/最多 50 条/],
    [[{name:'非法日期',number:'P06-DATE',acceptedAt:'2026-02-30'}],/日期真实存在/],
    [[{name:'未知字段',number:'P06-UNKNOWN',unexpected:'不应丢弃'}],/不支持该字段|未静默丢弃/],
  ]){
    const checked=validateCaseImportRows(value,['A2026-0912']);
    assert.equal(checked.ok,false,JSON.stringify(value));
    assert.match(checked.errors.map(item=>item.message).join('\n'),pattern);
  }
});

await record('P06-R22-LOGIC','引用定位、多来源、失效、无来源与权限边界',async()=>{
  const sections=[['第一段','第二段']];
  const detail={sources:[
    {id:'original',name:'材料甲',version:2,demo:true,pages:['张三反映其通过平台转账。']},
    {id:'forensic-1',name:'材料乙',version:1,demo:true,pages:['现场记录账号invest_demo。']},
  ],victim:'张三',network:'invest_demo',account:[]};
  const built=buildReportCitations({caseId:'CASE-T',reportId:'REP-T',detail,sections});
  assert.equal(built.length,2);
  assert.equal(built[0].caseId,'CASE-T');
  assert.equal(built[0].reportId,'REP-T');
  assert.equal(built[0].demo,true);

  const readyCitation={id:'C1',caseId:'CASE-T',reportId:'REP-T',text:'事实',sources:[{sourceId:'original',sourceVersion:2,page:1,quote:'张三反映'}]};
  const ready=resolveCitation(readyCitation,detail.sources);
  assert.equal(ready.status,'ready');
  assert.equal(ready.source.id,'original');
  assert.equal(ready.text,'张三反映其通过平台转账。');

  const multi={...readyCitation,id:'C2',sources:[{sourceId:'original',page:1},{sourceId:'forensic-1'}]};
  assert.equal(resolveCitation(multi,detail.sources,'forensic-1').source.id,'forensic-1');
  assert.equal(citationLocatorLabel({}),'未提供精确定位');
  const noLocation=resolveCitation({id:'C3',sources:[{sourceId:'forensic-1'}]},detail.sources);
  assert.equal(noLocation.status,'ready');
  assert.equal(noLocation.precise,false);
  assert.equal(noLocation.locator,'未提供精确定位');

  assert.equal(resolveCitation(null,detail.sources).status,'invalid');
  assert.equal(resolveCitation({id:'C4',sources:[]},detail.sources).status,'no-source');
  assert.equal(resolveCitation({id:'C5',reportId:'REP-T',sources:[{sourceId:'missing'}]},detail.sources).status,'unavailable');
  assert.equal(resolveCitation({id:'C6',sources:[{sourceId:'original',page:1,quote:'不存在的原文'}]},detail.sources).status,'invalid');
  const restricted=resolveCitation({id:'C7',sources:[{sourceId:'restricted'}]},[{id:'restricted',name:'受限材料',restricted:true,pages:['不得返回的原文']}]);
  assert.equal(restricted.status,'unavailable');
  assert.equal('text' in restricted,false);
  assert.equal(restricted.message.includes('未展示受限内容'),true);
});

let pw;
try{pw=await import('playwright');}
catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));}
const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});

async function surface({dark=false,downloads=false}={}){
  const context=await browser.newContext({viewport:{width:1363,height:936},colorScheme:dark?'dark':'light',acceptDownloads:downloads});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror',error=>runtimeErrors.push(error.message));
  await page.goto(`${base}/#/PG12`);
  if(dark){
    await page.evaluate(async()=>{const {state,save}=await import('/src/state.js');state.theme='dark';save();});
    await page.reload();
  }
  return {context,page};
}
const stateSnapshot=page=>page.evaluate(async()=>structuredClone((await import('/src/state.js')).state));
const closeModal=page=>page.locator('.modal [data-action="close"]').last().click();
const submitModal=page=>page.locator('#modal-form [type="submit"]').click();
async function openDraftReport(page){
  await page.locator('[data-action="open-case"][data-id="CASE-0817"]').click();
  await page.locator('.cd-detail').waitFor();
  await page.locator('[data-action="case-stage"][data-step="4"]').click();
  await page.locator('.cd-report-panel').waitFor();
}
const reportCitation=(page,id)=>page.locator(`.cd-report-paper [data-action="cd-report-source"][data-citation-id="${id}"]`);

await record('P06-R24-BROWSER','PG12 导入说明、模板往返、预览、取消、确认与失败原子性',async()=>{
  const {context,page}=await surface({downloads:true});
  try{
    const initial=(await stateSnapshot(page)).cases.length;
    await page.locator('[data-action="case-import"]').click();
    await page.locator('.case-import-fields').waitFor();
    assert.match(await page.locator('.case-import-intro').innerText(),/本地案件引用/);
    assert.equal(await page.locator('.case-import-fields dt').count(),10);
    await page.screenshot({path:path.join(output,'pg12-import-editor-light-1363x936.png')});

    const downloadPromise=page.waitForEvent('download');
    await page.locator('[data-action="case-import-template"]').click();
    const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'案件批量导入模板.json');
    const downloaded=await fs.readFile(await download.path(),'utf8');
    assert.deepEqual(JSON.parse(downloaded),CASE_IMPORT_TEMPLATE);

    const rows=[
      {name:'批量导入长编号案件',number:'00000000000000000024680',owner:'示例分局 · 刑侦大队',acceptedAt:'2026-10-03 10:20'},
      {name:'<img src=x onerror=alert(1)>',number:'P06-XSS'},
    ];
    const raw=JSON.stringify(rows,null,2);
    await page.locator('[name="rows"]').fill(raw);
    await submitModal(page);
    await page.locator('.case-import-preview').waitFor();
    assert.equal((await stateSnapshot(page)).cases.length,initial,'预览前不应写入正式列表');
    assert.match(await page.locator('.case-import-preview').innerText(),/00000000000000000024680/);
    await page.locator('#toast').evaluate(node=>node.classList.remove('show'));
    await page.screenshot({path:path.join(output,'pg12-import-preview-light-1363x936.png')});

    await page.locator('[data-action="case-import-edit"]').click();
    assert.equal(await page.locator('[name="rows"]').inputValue(),raw);
    await submitModal(page);
    await page.locator('.case-import-preview').waitFor();
    await closeModal(page);
    assert.equal((await stateSnapshot(page)).cases.length,initial,'取消预览不应写入正式列表');

    await page.locator('[data-action="case-import"]').click();
    await page.locator('[name="rows"]').fill('[\n {"name":"语法错误",\n]');
    await submitModal(page);
    assert.match(await page.locator('.form-error').innerText(),/JSON 语法错误/);
    assert.equal((await stateSnapshot(page)).cases.length,initial,'失败不应破坏原列表');
    await closeModal(page);

    await page.locator('[data-action="case-import"]').click();
    await page.locator('[name="rows"]').fill(raw);
    await submitModal(page);
    await page.locator('[data-action="case-import-confirm"]').click();
    await page.locator('.case-table tbody tr').filter({hasText:'00000000000000000024680'}).waitFor();
    const after=await stateSnapshot(page);
    assert.equal(after.cases.length,initial+2);
    assert.equal(after.cases.find(item=>item.number==='00000000000000000024680').number,'00000000000000000024680');
    assert.equal(await page.locator('.case-table img[src="x"]').count(),0);
    assert.match(await page.locator('#toast').innerText(),/已导入 2 条/);
  }finally{await context.close();}
});

await record('P06-R22-BROWSER','PG13 单/多来源、无定位、无来源、冻结引用、失效引用与焦点返回',async()=>{
  const {context,page}=await surface();
  try{
    await openDraftReport(page);
    await page.locator('[data-action="cd-export"]').click();
    assert.match(await page.locator('#toast').innerText(),/生成报告/);

    const single=reportCitation(page,'C3-1');
    await single.click();
    await page.locator('.cd-citation-preview').waitFor();
    assert.equal(await page.locator('.cd-citation-source-list [data-action="cd-report-source-select"]').count(),1);
    assert.match(await page.locator('.cd-citation-status').innerText(),/来源已定位/);
    assert.equal(await page.locator('#citation-target').count(),1);
    assert.match(await page.locator('.cd-citation-context').innerText(),/draft-CASE-0817/);
    await page.screenshot({path:path.join(output,'pg13-citation-single-light-1363x936.png')});
    await page.locator('.cd-citation-preview [data-action="close"]').click();
    assert.equal(await single.evaluate(node=>node===document.activeElement),true,'关闭后应回到原引用按钮');

    await reportCitation(page,'C3-2').click();
    const sourceButtons=page.locator('.cd-citation-source-list [data-action="cd-report-source-select"]');
    assert.equal(await sourceButtons.count(),2);
    const contextBefore=await page.locator('.cd-citation-context').innerText();
    await sourceButtons.filter({hasText:'笔录'}).click();
    assert.equal(await page.locator('.cd-citation-context').innerText(),contextBefore);
    assert.equal(await page.locator('#citation-target').count(),1);
    assert.match(await page.locator('.cd-citation-document').innerText(),/transcript-1|笔录/);
    await page.screenshot({path:path.join(output,'pg13-citation-multi-light-1363x936.png')});
    await closeModal(page);

    await reportCitation(page,'C3-3').click();
    assert.match(await page.locator('.cd-citation-status').innerText(),/未提供精确定位/);
    assert.match(await page.locator('.cd-citation-location').innerText(),/未提供精确定位/);
    await page.screenshot({path:path.join(output,'pg13-citation-no-location-light-1363x936.png')});
    await closeModal(page);

    await page.locator('[data-action="cd-report-section"][data-id="5"]').click();
    await reportCitation(page,'C6-1').click();
    assert.match(await page.locator('.cd-citation-status').innerText(),/没有来源/);
    assert.equal(await page.locator('.cd-citation-document').count(),0);
    await closeModal(page);

    await page.locator('[data-action="cd-generate-report"]').click();
    const generated=await stateSnapshot(page);
    const report=generated.reports.find(item=>item.id===generated.caseFlows['CASE-0817'].detail.reportId);
    assert(report);
    assert(Array.isArray(report.citations)&&report.citations.length>0);
    assert(Array.isArray(report.caseSources)&&report.caseSources.length>0);
    assert(report.citations.every(item=>item.reportId===report.id));

    await page.locator('[data-action="cd-report-section"][data-id="2"]').click();
    await page.evaluate(async()=>{
      const {state,save}=await import('/src/state.js');
      const report=state.reports.find(item=>item.id===state.caseFlows['CASE-0817'].detail.reportId);
      report.citations.find(item=>item.id==='C3-1').sources[0].page=99;
      save();
    });
    await page.reload();
    await reportCitation(page,'C3-1').click();
    assert.match(await page.locator('.cd-citation-status').innerText(),/引用失效/);
  }finally{await context.close();}
});

await record('P06-R22-DARK','报告来源预览支持深色主题',async()=>{
  const {context,page}=await surface({dark:true});
  try{
    await openDraftReport(page);
    await reportCitation(page,'C3-2').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.screenshot({path:path.join(output,'pg13-citation-multi-dark-1363x936.png')});
  }finally{await context.close();}
});

await browser.close();
const payload={generatedAt:'2026-10-03',base,results,runtimeErrors};
await fs.writeFile(path.join(output,'prompt-06-results.json'),JSON.stringify(payload,null,2));
const failures=results.filter(item=>item.status==='FAIL');
assert.deepEqual(runtimeErrors,[],'浏览器运行时错误');
assert.equal(failures.length,0,failures.map(item=>`${item.id}: ${item.error}`).join('\n'));
console.log(`PASS ${results.length} Prompt 06 acceptance groups`);
