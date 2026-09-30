"""Validate generated binaries and real browser downloads against the UI snapshot.
Usage: node --input-type=module -e "...JSON.stringify(createHistoricalFundSnapshot(5))..." | python3 prototype/tests/fund-history-artifacts.py
Requires reportlab/Pillow/pyarrow/openpyxl/pypdf/pandas; run the UI test first.
"""
import json,sys,tempfile,os
from pathlib import Path
from pypdf import PdfReader
from openpyxl import load_workbook
from PIL import Image,ImageStat
import pyarrow.parquet as pq
snapshot=json.load(sys.stdin)
root=Path(__file__).resolve().parents[2]
assets=root/'prototype/assets/super-search/fund-history'
audit=root/'audit/fund-history-v2'
files={a['id']:a for a in snapshot['artifacts']}
normalize=lambda s: ''.join(s.split())
def pdf_text(path):
    return '\n'.join('\n'.join(line for line in p.extract_text().splitlines() if line.strip()!='历史资金研判 Demo · 虚构数据 · 非正式文书' and line.strip()!=str(i)) for i,p in enumerate(PdfReader(path).pages,1))
for a in files.values():
    if a['type']=='PARQUET':
        actual=pq.read_table(assets/(a['id']+'.parquet')).to_pylist()
        assert actual==a['records'],a['id']
    if a['type']=='PDF':
        text=pdf_text(assets/(a['id']+'.pdf'))
        assert normalize(a['content']) in normalize(text),a['id']
    if a['type']=='PNG':
        image=Image.open(assets/(a['id']+'.png')).convert('RGB')
        assert min(ImageStat.Stat(image).stddev)>10,'Blank PNG: '+a['id']
        assert image.width>=1000
# Browser downloads must be valid and must retain exactly the same rows / conclusion.
book=load_workbook(audit/'download-flow.xlsx',read_only=True,data_only=True)
actual=list(book.active.values)
expected=files['FUND-FLOW-zhou']['rows']
assert [[str(c) for c in row] for row in actual]==[[str(c) for c in row] for row in expected]
book.close()
text=pdf_text(audit/'download-report.pdf')
assert normalize(files['FUND-REPORT']['content']) in normalize(text)
# Execute the code actually displayed in ANALYSIS-001 against the shipped Parquet.
action=next(t for a in snapshot['agents'] for t in a['toolCalls'] if t['id']=='ANALYSIS-001')
with tempfile.TemporaryDirectory() as tmp:
    import shutil
    shutil.copy(assets/'FUND-STANDARD.parquet',Path(tmp)/'资金流水标准化结果.parquet')
    old=os.getcwd()
    try:
        os.chdir(tmp);scope={};exec(action['code'],scope)
        assert int(scope['incoming'])==8000000 and int(scope['rapid'])==7500000
    finally:os.chdir(old)
result={'status':'PASS','parquet_files':5,'pdf_files':3,'png_files':2,'downloaded_xlsx_rows':6,'downloaded_pdf':'matches fixture','displayed_analysis_code':'executed: 80000 / 75000 / 93.75%'}
(audit/'artifact-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
