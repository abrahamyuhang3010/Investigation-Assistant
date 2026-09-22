import {esc} from './ui.js';

/** Small, dependency-free OOXML writer. ZIP entries use the standard STORE method. */
const encode=s=>new TextEncoder().encode(s);
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function header(size,fields){const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [offset,value,width] of fields)width===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return b;}
function zip(entries){let offset=0,centralSize=0;const local=[],central=[];for(const [path,content] of Object.entries(entries)){const name=encode(path),data=encode(content),crc=crc32(data);const h=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,name.length,2]]);local.push(h,name,data);const c=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,name.length,2],[42,offset,4]]);central.push(c,name);offset+=h.length+name.length+data.length;centralSize+=c.length+name.length;}return new Blob([...local,...central,header(22,[[0,0x06054b50,4],[8,central.length/2,2],[10,central.length/2,2],[12,centralSize,4],[16,offset,4]])],{type:'application/zip'});}
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function artifactRows(a){
 if(a.rows)return a.rows;
 const base=a.toolCallId?.replace(/-Q\d+$/,'');
 const rows={
 'TOOL-PROFILE':[['姓名','主体标识','核验状态'],['张三（合成）','220221********3544','示例一致']],
 'TOOL-BANK':[['开户主体','银行卡号','账户状态'],['张三（合成）','6222 **** 3544','正常']],
 'TOOL-FLOW':[['日期','付款方','收款方','金额（CNY）'],['2026-08-03','6222 **** 3544','6217 **** 8866','12000'],['2026-08-08','6222 **** 3544','6217 **** 8866','15000'],['2026-08-21','6217 **** 8866','6222 **** 3544','11600']],
 'TOOL-NET':[['平台','账号','实名主体'],['微信支付','wx_demo_zhangsan','张三（合成）']],
 'TOOL-METRIC':[['统计口径','金额（CNY）'],['流入','286400'],['流出','249800'],['净流入','36600']],
 'TOOL-LINK':[['线索编号','规则命中','核验状态'],...Array.from({length:6},(_,i)=>[`DEMO-${i+1}`,'短时高频交易','待人工核验'])]
 };
 if(base==='TOOL-NORM')return [['原始行号',...rows['TOOL-FLOW'][0]],...rows['TOOL-FLOW'].slice(1).map((r,i)=>[String(i+1),...r])];
 return rows[base]||[['材料','说明'],[a.name,a.preview||'本地合成材料']];
}
export function xlsxBlob(rows){return zip({
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="合成示例" sheetId="1" r:id="rId1"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="20" width="25" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`
 });}
export function artifactPreview(a){
 if(a.pending)return '<p>文件尚未生成。</p>';
 const type=a.type.toLowerCase();
 if(['xlsx','csv'].includes(type)&&(!a.dataUrl||a.rows)){const rows=artifactRows(a);return `<div class="ss-table-preview"><table><thead><tr>${rows[0].map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="muted small">${a.sourceType==='user_upload'?'用户上传内容（XLSX 最多显示首张表的 200 条数据、30 列；公式仅显示缓存值）':'合成样本预览；表格仅含演示行，不是完整业务明细。'}</p>`;}
 if(['png','jpg','jpeg','webp','gif'].includes(type)&&a.dataUrl)return `<img class="ss-image-preview" src="${esc(a.dataUrl)}" alt="${esc(a.name)}">`;
 if(type==='pdf'&&!a.dataUrl&&a.dataGap)return `<article class="ss-pdf-preview"><h2>数据缺口报告</h2><p>合成演示 · 非正式研判文书</p><p>部分来源返回空结果，缺少必要输入，无法完成统计与关系核验。未发现不代表不存在，请补充材料后重新查询。</p><p>${esc(a.queryId)} / ${esc(a.subtaskId)} / ${esc(a.toolCallId)}</p></article>`;
 if(type==='pdf'&&!a.dataUrl)return `<article class="ss-pdf-preview"><span>合成演示 · 非正式研判文书</span><h2>资金分析报告</h2><h3>一、任务与范围</h3><p>核验张三合成样本的身份、银行卡及第三方支付账户；统计窗口为 2026 年 8 月。</p><h3>二、样本统计</h3><p>流入 ¥286,400；流出 ¥249,800；净流入 ¥36,600。</p><h3>三、待核验线索</h3><p>6 笔高频交易命中示例规则，1 条两跳资金路径待人工复核。规则命中不构成违法认定。</p><h3>四、来源与限制</h3><p>${esc(a.queryId)} / ${esc(a.subtaskId)} / ${esc(a.toolCallId)}。基础来源为开户信息、银行流水、第三方账号与分析结果；仅合成数据，未接入真实业务系统。</p><footer>1 / 1</footer></article>`;
 if(a.dataUrl&&['pdf','xlsx','zip'].includes(type))return `<p>原始 ${esc(a.type)} 文件已保留，可下载后使用本地阅读器打开。${a.previewError?esc(a.previewError):'此原型不解析上传的 PDF / 压缩包内容。'}</p>`;
 let text=a.content??a.preview??'暂无可预览内容。';
 if(type==='json'){try{text=JSON.stringify(JSON.parse(text),null,2)}catch{/* Preserve invalid original text. */}}
 return `<pre class="ss-preview-content">${esc(text)}</pre>`;
}
/** Rasterizes the same report preview into a valid one-page PDF, preserving Chinese glyphs without a bundled font. */
async function pdfBlob(a){
 const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1190,1684);c.fillStyle='#111827';
 let y=120;const lines=['资金分析报告','合成演示 · 非正式研判文书','一、任务与范围','张三合成样本：身份、银行卡及第三方支付账户。','统计窗口：2026 年 8 月。','二、样本统计','流入 ¥286,400；流出 ¥249,800；净流入 ¥36,600。','三、待核验线索','6 笔高频交易命中示例规则，1 条两跳资金路径待人工复核。','规则命中不构成违法认定。','四、来源与限制',`${a.queryId} / ${a.subtaskId} / ${a.toolCallId}`,'来源：开户信息、银行流水、第三方账号及分析结果。','仅合成数据，未接入真实业务系统。'];
 if(a.dataGap)lines.splice(0,lines.length,'数据缺口报告','合成演示 · 非正式研判文书','部分来源返回空结果，缺少必要输入。','无法完成统计与关系核验。','未发现不代表不存在，请补充材料后重新查询。',`${a.queryId} / ${a.subtaskId} / ${a.toolCallId}`);
 for(let i=0;i<lines.length;i++){c.font=`${i===0?'bold 42':'26'}px sans-serif`;c.fillText(lines[i],85,y);y+=i===0?85:65;}
 const jpeg=new Uint8Array(await (await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94))).arrayBuffer());
 const objects=[encode('<< /Type /Catalog /Pages 2 0 R >>'),encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'),new Blob([encode(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,encode('\nendstream')]),encode(`<< /Length ${encode('q 595 0 0 842 0 0 cm /Im0 Do Q\n').length} >>\nstream\nq 595 0 0 842 0 0 cm /Im0 Do Q\nendstream`)];
 const parts=[encode('%PDF-1.4\n')],offsets=[0];let position=parts[0].length;
 for(let i=0;i<objects.length;i++){offsets.push(position);const part=new Blob([`${i+1} 0 obj\n`,objects[i],'\nendobj\n']);parts.push(part);position+=part.size;}
 parts.push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}
export async function downloadSuperArtifact(a){
 if(!a||a.pending)throw Error('文件尚未生成。');
 let blob;
 if(a.dataUrl)blob=await (await fetch(a.dataUrl)).blob();
 else if(a.type==='XLSX')blob=xlsxBlob(artifactRows(a));
 else if(a.type==='PDF')blob=await pdfBlob(a);
 else if(a.type==='ZIP')blob=zip({'README.txt':'用户上传区域的合成演示材料，不包含真实个人数据。'});
 else blob=new Blob([a.content??a.preview??''],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=a.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
export async function uploadSuperFile(file,ss){
 if(!file)return;
 if(file.size>1024*1024)throw Error('本地快照最多支持 1 MB 的单个文件，请缩小文件后重试。');
 const type=file.name.split('.').pop().toUpperCase();if(!['TXT','MD','JSON','CSV','XLSX','PDF','ZIP','PNG','JPG','JPEG','WEBP','GIF'].includes(type))throw Error('不支持该格式。支持文档、表格、PDF、ZIP 和常见图片。');
 if(ss.artifacts.filter(a=>a.dataUrl).reduce((sum,a)=>sum+(a.dataUrl?.length||0),0)>2500000)throw Error('本地上传空间已满，请使用新的搜索会话。');
 const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('文件读取失败'));reader.readAsDataURL(file);});
 const a={id:'UPLOAD-'+crypto.randomUUID(),name:file.name,type,size:`${(file.size/1024).toFixed(1)} KB`,sourceType:'user_upload',dataUrl};
 if(['TXT','MD','JSON','CSV'].includes(type))a.content=await file.text();
 if(type==='XLSX'){try{a.rows=await readXlsxRows(file);}catch(error){a.previewError=error.message;}}
 if(type==='CSV'){a.rows=parseCSV(a.content);delete a.dataUrl;/* Plain UTF-8 CSV remains downloadable from content. */}
 ss.artifacts.push(a);ss.activeTab='文档空间';if(!ss.ui.expandedFolders.includes('UPLOAD'))ss.ui.expandedFolders.push('UPLOAD');return a;
}
function parseCSV(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell='';}else if(ch==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=ch;}if(cell||row.length)rows.push([...row,cell]);return rows.length?rows:[['空文件']];}

/** Read-only first-sheet preview; never executes formulas, macros, or external links. */
async function readXlsxRows(file){
 const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer),decoder=new TextDecoder();
 let end=bytes.length-22;while(end>=Math.max(0,bytes.length-65557)&&view.getUint32(end,true)!==0x06054b50)end--;
 if(end<0||view.getUint32(end,true)!==0x06054b50)throw Error('未找到 XLSX 文件目录');
 let pos=view.getUint32(end+16,true),total=0;const entries=new Map();
 const count=view.getUint16(end+10,true);if(count>500)throw Error('文件包含过多条目');
 for(let i=0;i<count;i++){
  if(view.getUint32(pos,true)!==0x02014b50)throw Error('无效的文件目录');
  const method=view.getUint16(pos+10,true),size=view.getUint32(pos+20,true),unpacked=view.getUint32(pos+24,true),len=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),offset=view.getUint32(pos+42,true),name=decoder.decode(bytes.slice(pos+46,pos+46+len));
  total+=unpacked;if(total>5*1024*1024)throw Error('解压后内容超过预览上限');
  entries.set(name,{method,size,offset});pos+=46+len+extra+comment;
 }
 async function xmlEntry(name){const entry=entries.get(name);if(!entry)return null;const {method,size,offset}=entry,start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true);let data=bytes.slice(start,start+size);
  if(method===8){const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>5*1024*1024){await reader.cancel();throw Error('工作表超过预览上限');}chunks.push(part.value);}data=new Uint8Array(await new Blob(chunks).arrayBuffer());}else if(method!==0)throw Error('不支持该压缩格式');
  const text=decoder.decode(data);if(/<!DOCTYPE/i.test(text))throw Error('不支持带外部声明的 XML');const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('XML 格式异常');return doc;
 }
 const strings=[...(await xmlEntry('xl/sharedStrings.xml'))?.querySelectorAll('si')||[]].map(si=>[...si.querySelectorAll('t')].map(t=>t.textContent).join(''));
 const workbook=await xmlEntry('xl/workbook.xml'),rels=await xmlEntry('xl/_rels/workbook.xml.rels'),id=workbook?.querySelector('sheet')?.getAttribute('r:id');
 const target=[...rels?.querySelectorAll('Relationship')||[]].find(r=>r.getAttribute('Id')===id)?.getAttribute('Target')||'worksheets/sheet1.xml';
 const path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');const sheet=await xmlEntry(path);if(!sheet)throw Error('找不到首个工作表');
 const rows=[...sheet.querySelectorAll('sheetData row')].slice(0,201).map(row=>{const cells=[];for(const cell of row.querySelectorAll('c')){let column=0;for(const ch of (cell.getAttribute('r')||'A').replace(/\d/g,''))column=column*26+ch.charCodeAt(0)-64;if(column>30)continue;const value=cell.querySelector('v')?.textContent||'';cells[column-1]=cell.getAttribute('t')==='s'?(strings[Number(value)]||''):cell.getAttribute('t')==='inlineStr'?cell.querySelector('is')?.textContent||'':value;}return Array.from({length:cells.length},(_,i)=>cells[i]||'');});
 return rows.length?rows:[['空工作表']];
}
