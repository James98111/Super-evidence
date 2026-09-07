#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re, sys, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from openpyxl import load_workbook

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'apra-market'
FUNDS=OUT/'funds'
URL='https://www.apra.gov.au/system/files/2026-06/Quarterly%20Superannution%20Product%20Statistics%20-%20Product%20Structure.xlsx'
TMP=Path('/tmp/apra-product-structure.xlsx')
UA='SuperEvidence/0.1 (+public Australian super research)'

def norm(v): return re.sub(r'\s+',' ',str(v or '').replace('\n',' ')).strip().lower()
def clean(v): return '' if v is None else str(v).strip()
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower().replace('&',' and ')).strip('-') or 'fund'

def fetch():
    req=urllib.request.Request(URL,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=120) as r, TMP.open('wb') as f:
        while True:
            b=r.read(1024*1024)
            if not b: break
            f.write(b)
    print('downloaded',TMP.stat().st_size,'bytes',flush=True)

def score(row):
    ns=[norm(x) for x in row]
    terms=['rse','superannuation product','investment menu','investment option','identifier']
    return sum(any(t in x for t in terms) for x in ns)

def find(headers,*terms):
    m={h:norm(h) for h in headers}
    for t in terms:
        t=norm(t)
        for h,n in m.items():
            if n==t:return h
    for t in terms:
        t=norm(t)
        candidates=[h for h,n in m.items() if t in n]
        if candidates:return min(candidates,key=lambda h:len(m[h]))
    return None

def rowdict(headers,values):
    vals=list(values)+[None]*max(0,len(headers)-len(values))
    return {headers[i]:vals[i] for i in range(len(headers))}

def classify(cat):
    c=norm(cat)
    return 'direct_asset' if c in {'direct cash account','direct term deposit','direct fixed income instrument','direct shares','direct hybrid security'} or c.startswith('direct ') else 'managed_option'

def main():
    fetch()
    digest=hashlib.sha256(TMP.read_bytes()).hexdigest()
    wb=load_workbook(TMP,read_only=True,data_only=True)
    records={}
    schemas=[]
    for ws in wb.worksheets:
        it=ws.iter_rows(values_only=True)
        probe=[]
        for _ in range(40):
            try: probe.append(next(it))
            except StopIteration: break
        if not probe: continue
        idx=max(range(len(probe)),key=lambda i:score(probe[i]))
        if score(probe[idx])<2:
            schemas.append({'sheet':ws.title,'skipped':True,'reason':'no structure header detected'})
            continue
        headers=[clean(x) or f'column_{i+1}' for i,x in enumerate(probe[idx])]
        cols={
          'fund':find(headers,'RSE Name','RSE Name Text','Fund Name'),
          'licensee':find(headers,'RSE Licensee Name','RSE Licensee Name Text'),
          'product':find(headers,'Superannuation Product Name','Superannuation Product Name Text'),
          'product_id':find(headers,'Superannuation Product Identifier'),
          'menu':find(headers,'Investment Menu Name','Investment Menu Name Text'),
          'menu_id':find(headers,'Investment Menu Identifier'),
          'option':find(headers,'Investment Option Name','Investment Option Name Text'),
          'option_id':find(headers,'Investment Option Identifier'),
          'category':find(headers,'Investment Option Category','Investment Option Category Type'),
          'option_type':find(headers,'Investment Option Type'),
          'management':find(headers,'Investment Option Management Type'),
          'strategy_setting':find(headers,'Investment Option Strategy Setting Type'),
          'description':find(headers,'Investment Option Description','Investment Option Description Text'),
          'product_type':find(headers,'Superannuation Product Type'),
          'menu_type':find(headers,'Investment Menu Type'),
        }
        schemas.append({'sheet':ws.title,'headers':headers,'mapped':cols})
        rows=list(probe[idx+1:])
        rows.extend(it)
        count=0
        for vals in rows:
            d=rowdict(headers,vals)
            fund=clean(d.get(cols['fund'])) if cols['fund'] else ''
            option=clean(d.get(cols['option'])) if cols['option'] else ''
            option_id=clean(d.get(cols['option_id'])) if cols['option_id'] else ''
            if not fund or (not option and not option_id): continue
            product=clean(d.get(cols['product'])) if cols['product'] else ''
            product_id=clean(d.get(cols['product_id'])) if cols['product_id'] else ''
            menu=clean(d.get(cols['menu'])) if cols['menu'] else ''
            menu_id=clean(d.get(cols['menu_id'])) if cols['menu_id'] else ''
            key=(fund,product_id or product,menu_id or menu,option_id or option)
            rec=records.setdefault(key,{
              'fund':fund,'licensee':clean(d.get(cols['licensee'])) if cols['licensee'] else '',
              'product_name':product,'product_id':product_id,'product_type':clean(d.get(cols['product_type'])) if cols['product_type'] else '',
              'menu_name':menu,'menu_id':menu_id,'menu_type':clean(d.get(cols['menu_type'])) if cols['menu_type'] else '',
              'option_name':option,'option_id':option_id,
              'option_category':clean(d.get(cols['category'])) if cols['category'] else '',
              'option_type':clean(d.get(cols['option_type'])) if cols['option_type'] else '',
              'management_type':clean(d.get(cols['management'])) if cols['management'] else '',
              'strategy_setting_type':clean(d.get(cols['strategy_setting'])) if cols['strategy_setting'] else '',
              'description':clean(d.get(cols['description'])) if cols['description'] else '',
              'attributes':{},'source_sheets':[]
            })
            core={x for x in cols.values() if x}
            for h,v in d.items():
                if h not in core and clean(v): rec['attributes'].setdefault(h,clean(v))
            if ws.title not in rec['source_sheets']: rec['source_sheets'].append(ws.title)
            count+=1
        print(ws.title,count,'option rows',flush=True)
    by=defaultdict(list)
    for r in records.values():
        r['consumer_group']=classify(r['option_category'])
        by[r['fund']].append(r)
    OUT.mkdir(parents=True,exist_ok=True);FUNDS.mkdir(parents=True,exist_ok=True)
    index=[];used={}
    for name in sorted(by,key=str.casefold):
        rs=by[name];s=slug(name)
        if s in used and used[s]!=name:s=f"{s}-{hashlib.sha1(name.encode()).hexdigest()[:7]}"
        used[s]=name
        managed=[r for r in rs if r['consumer_group']=='managed_option'];direct=[r for r in rs if r['consumer_group']=='direct_asset']
        products=sorted({r['product_name'] for r in rs if r['product_name']});menus=sorted({r['menu_name'] for r in rs if r['menu_name']})
        lic=next((r['licensee'] for r in rs if r['licensee']),None)
        payload={'schema_version':1,'source':{'organisation':'APRA','publication':'Quarterly Superannuation Product Statistics — Product Structure','reporting_period':'2026-03-31'},'fund':{'name':name,'licensee':lic,'slug':s},'summary':{'products':len(products),'menus':len(menus),'managed_options':len(managed),'direct_assets':len(direct),'total_option_records':len(rs)},'products':products,'menus':menus,'options':sorted(rs,key=lambda r:(r['consumer_group'],r['product_name'],r['menu_name'],r['option_name']))}
        (FUNDS/f'{s}.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        index.append({'name':name,'slug':s,'licensee':lic,**payload['summary']})
    if len(index)<20: raise RuntimeError(f'Only {len(index)} funds parsed; refusing publication')
    total=sum(x['total_option_records'] for x in index)
    if total<1000: raise RuntimeError(f'Only {total} option records parsed; refusing publication')
    generated=datetime.now(timezone.utc).isoformat()
    (OUT/'funds-index.json').write_text(json.dumps({'schema_version':1,'source':'APRA QSPS Product Structure','reporting_period':'2026-03-31','generated_at':generated,'fund_count':len(index),'funds':index},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (OUT/'structure-schema.json').write_text(json.dumps(schemas,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'structure-manifest.json').write_text(json.dumps({'url':URL,'sha256':digest,'bytes':TMP.stat().st_size,'generated_at':generated,'fund_count':len(index),'total_option_records':total},indent=2),encoding='utf-8')
    print('VALIDATED',len(index),'funds',total,'option records',flush=True)

if __name__=='__main__': main()
