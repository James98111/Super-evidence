#!/usr/bin/env python3
from __future__ import annotations
import csv, io, json, re, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'apra-market'/'cppp-2026-inspection.json'
PAGE='https://www.apra.gov.au/cppp-product-performance'
UA='SuperEvidence/0.6 (+public Australian super research)'

class Links(HTMLParser):
    def __init__(self): super().__init__();self.items=[]
    def handle_starttag(self,tag,attrs):
        if tag!='a':return
        d=dict(attrs);href=d.get('href')
        if href:self.items.append(href)

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=120) as r:return r.read()

def main():
    raw=fetch(PAGE).decode('utf-8','replace');p=Links();p.feed(raw)
    urls=[]
    for href in p.items:
        u=urllib.parse.urljoin(PAGE,href)
        if '.csv' in u.lower() and ('2026' in u.lower() or 'cppp' in u.lower()):
            if u not in urls:urls.append(u)
    result={'page':PAGE,'files':[]}
    for u in urls:
        body=fetch(u);text=body.decode('utf-8-sig','replace')
        reader=csv.reader(io.StringIO(text));rows=list(reader)
        # Keep the first few rows verbatim; APRA CSVs sometimes have metadata rows above headers.
        result['files'].append({'url':u,'bytes':len(body),'rows':len(rows),'preview':rows[:8]})
        print(u,len(body),len(rows),flush=True)
    if len(result['files'])<4:raise RuntimeError(f'Expected at least four CPPP CSVs, found {len(result["files"])}')
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':main()
