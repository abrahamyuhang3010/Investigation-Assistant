"""Build valid PDF, PNG and Parquet artifacts; never rename text to a binary extension."""
import json, sys, os
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont
import pyarrow as pa
import pyarrow.parquet as pq

snapshot=json.load(sys.stdin)
out=Path(__file__).resolve().parents[1]/'assets/super-search/fund-history'
out.mkdir(parents=True,exist_ok=True)
font_path=os.environ.get('FUND_FONT','/System/Library/Fonts/STHeiti Light.ttc')
pdfmetrics.registerFont(TTFont('FundCJK',font_path))
body=ParagraphStyle('body',fontName='FundCJK',fontSize=10,leading=17,spaceAfter=9,wordWrap='CJK',textColor=colors.HexColor('#273449'))
heading=ParagraphStyle('title',parent=body,fontSize=18,leading=27,spaceAfter=20)
font_path=os.environ.get('FUND_FONT','/System/Library/Fonts/STHeiti Light.ttc')
font=ImageFont.truetype(font_path,25)
small=ImageFont.truetype(font_path,20)

def footer(canvas,doc):
    canvas.setFont('FundCJK',8)
    canvas.setFillColor(colors.HexColor('#667085'))
    canvas.drawString(42,28,'历史资金研判 Demo · 虚构数据 · 非正式文书')
    canvas.drawRightString(550,28,str(doc.page))

for a in snapshot['artifacts']:
    if a['type'] not in ('PDF','PNG','PARQUET'): continue
    target=out/(a['id']+'.'+a['type'].lower())
    if a['type']=='PDF':
        story=[Paragraph(escape(a['name'][:-4]),heading)]
        for line in a['content'].splitlines():
            story.append(Paragraph(escape(line).replace('→',' → '),body) if line else Spacer(1,8))
        SimpleDocTemplate(str(target),pagesize=(595.28,841.89),leftMargin=42,rightMargin=42,topMargin=42,bottomMargin=48).build(story,onFirstPage=footer,onLaterPages=footer)
    elif a['type']=='PARQUET':
        pq.write_table(pa.Table.from_pylist(a['records']),target)
    elif a['id']=='FUND-GRAPH-IMAGE':
        im=Image.new('RGB',(1500,1150),'#f8fafc');d=ImageDraw.Draw(im)
        d.text((44,28),'陈浩案资金关系图｜模拟历史最终态',font=font,fill='#172b4d')
        positions={'chen':(580,105),'zhou':(580,300),'lin':(50,510),'liu':(450,510),'liang':(850,510),'merchant':(1160,760),'jiang':(50,980),'ma':(450,980),'liangpay':(850,750),'he':(850,980)}
        nodes={e['id'].removeprefix('FUND-A-'):e for e in snapshot['entities'] if e['id'].startswith('FUND-A-')}
        for t in a['graphTransactions']:
            x,y=positions[t['from']];tx,ty=positions[t['to']]
            if t['to']=='merchant':
                d.line((x+270,y+43,1400,y+43,1400,ty),fill='#7d91ac',width=3)
                d.text((1160,y+15),'¥5,000',font=small,fill='#245bc2')
                continue
            d.line((x+130,y+86,tx+130,ty),fill='#7d91ac',width=3)
            dx=-160 if t['id'].endswith('001') else 8
            d.text(((x+tx)//2+130+dx,(y+86+ty)//2),f"¥{t['amountCents']/100:,.0f}",font=small,fill='#245bc2')
        for key,(x,y) in positions.items():
            n=nodes[key]
            d.rounded_rectangle((x,y,x+270,y+86),radius=12,fill='white',outline='#c9d4e4',width=2)
            d.text((x+12,y+10),n['title'],font=font,fill='#172b4d')
            d.text((x+12,y+47),n['properties']['账号'],font=small,fill='#52637c')
        d.text((44,1100),'¥75,000 / ¥80,000 = 93.75%（9分钟）；¥5,000 商户支付不计入快速转出。全部虚构。',font=small,fill='#52637c')
        im.save(target)
    else:
        im=Image.new('RGB',(1250,530),'white');d=ImageDraw.Draw(im)
        for i,line in enumerate(a['content'].splitlines()):
            # Wrap the long simulation disclosure explicitly.
            for j,start in enumerate(range(0,len(line),45)):
                d.text((42,36+i*60+j*30),line[start:start+45],font=font,fill='#273449')
        im.save(target)
    print(target)
