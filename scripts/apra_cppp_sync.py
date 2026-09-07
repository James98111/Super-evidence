#!/usr/bin/env python3
from __future__ import annotations
import csv, io, json, re, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'apra-market'/'cppp-2026.json'
STATS=ROOT/'data'/'apra-market'/'cppp-2026-stats.json'
PAGE='https://www.apra.gov.au/cppp-product-performance'
UA='SuperEvidence/0.7 (+public Australian super research)'

class Links(HTMLParser):
    def __init__(self):super().__init__();self.items=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':
            href=dict(attrs).get('href')
            if href:self.items.append(href)

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=120) as r:return r.read()

def dec_pct(v):
    if v is None or str(v).strip()=='':return None
    try:return round(float(v)*100,6)
    except:return None

def number(v):
    if v is None or str(v).strip()=='':return None
    try:return float(v)
    except:return None

def text(v):
    v=str(v or '').strip();return v or None

def growth_band(v):
    x=dec_pct(v)
    if x is None:return None
    if x<=40:return'0%-40%'
    if x<=60:return'40%-60%'
    if x<=75:return'60%-75%'
    if x<=90:return'75%-90%'
    if x<=100:return'90%-100%'
    return'>100%'

def classify(url):
    u=urllib.parse.unquote(url).lower()
    if 'mysuper' in u:return'mysuper'
    if 'non-platform tdps' in u:return'non_platform_tdp'
    if 'platform tdps' in u:return'platform_tdp'
    if 'non-platform edps' in u:return'non_platform_edp'
    return'unknown'

def val(row,*keys):
    for k in keys:
        if k in row:return row.get(k)
    return None

def normalise(row,kind,source_url):
    my=kind=='mysuper'
    option_name=text(val(row,'investment_option_name'))
    lifecycle=text(val(row,'lifecycle_stage_name'))
    product=text(val(row,'superannuation_product_name','mysuper_product_name'))
    growth_raw=val(row,'strategic_growth_asset_allocation')
    rec={
      'cppp_type':kind,
      'source_url':source_url,
      'rse_licensee':text(val(row,'rse_licensee')),
      'fund':text(val(row,'rse_name')),
      'public_offer_status':text(val(row,'public_offer_status')),
      'product_name':product,
      'product_category':text(val(row,'product_category')),
      'menu_name':text(val(row,'investment_menu_name')),
      'option_id':text(val(row,'investment_option_identifier')),
      'option_name':option_name or lifecycle or product,
      'lifecycle_stage_name':lifecycle,
      'lifecycle_indicator':text(val(row,'single_strategy_lifecycle_indicator')),
      'pathway_id':text(val(row,'pathway_identifier')),
      'open_closed_to_new_members':text(val(row,'open_closed_to_new_members')),
      'member_assets_000':number(val(row,'member_assets_000')),
      'member_accounts':number(val(row,'member_accounts')),
      'growth_weight_pct':dec_pct(growth_raw),
      'growth_band':text(val(row,'strategic_growth_asset_allocation_category')) or growth_band(growth_raw),
      'performance_test_measure_pct':dec_pct(val(row,'performance_test_measure')),
      'pass_fail_indicator':text(val(row,'pass_fail_indicator')),
      'lookback_period_years':number(val(row,'lookback_period_years')),
      'actual_return_minus_benchmark_pct':dec_pct(val(row,'actual_return_minus_benchmark_return')),
      'rafe_pct':dec_pct(val(row,'representative_administration_fees_and_expenses_rafe')),
      'brafe_pct':dec_pct(val(row,'relevant_benchmark_representative_administration_fees_and_expenses_brafe')),
      'return_10y_pct':dec_pct(val(row,'10_year_net_investment_return_nir_p_a')),
      'return_vs_saa_10y_pct':dec_pct(val(row,'10_year_nir_relative_to_saa_benchmark_portfolio_p_a')),
      'return_vs_srp_10y_pct':dec_pct(val(row,'10_year_nir_relative_to_simple_reference_portfolio_p_a')),
      'return_7y_pct':dec_pct(val(row,'7_year_net_investment_return_nir_p_a')),
      'return_vs_saa_7y_pct':dec_pct(val(row,'7_year_nir_relative_to_saa_benchmark_portfolio_p_a')),
      'return_vs_srp_7y_pct':dec_pct(val(row,'7_year_nir_relative_to_simple_reference_portfolio_p_a')),
      'return_5y_pct':dec_pct(val(row,'5_year_net_investment_return_nir_p_a')),
      'return_vs_saa_5y_pct':dec_pct(val(row,'5_year_nir_relative_to_saa_benchmark_portfolio_p_a')),
      'return_vs_srp_5y_pct':dec_pct(val(row,'5_year_nir_relative_to_simple_reference_portfolio_p_a')),
      'return_3y_pct':dec_pct(val(row,'3_year_net_investment_return_nir_p_a')),
      'return_vs_saa_3y_pct':dec_pct(val(row,'3_year_nir_relative_to_saa_benchmark_portfolio_p_a')),
      'return_vs_srp_3y_pct':dec_pct(val(row,'3_year_nir_relative_to_simple_reference_portfolio_p_a')),
      'admin_fee_10k_pct':dec_pct(val(row,'administration_fees_and_costs_charged_10_000_account_balance')),
      'admin_fee_25k_pct':dec_pct(val(row,'administration_fees_and_costs_charged_25_000_account_balance')),
      'admin_fee_50k_pct':dec_pct(val(row,'administration_fees_and_costs_charged_50_000_account_balance')),
      'admin_fee_100k_pct':dec_pct(val(row,'administration_fees_and_costs_charged_100_000_account_balance')),
      'admin_fee_250k_pct':dec_pct(val(row,'administration_fees_and_costs_charged_250_000_account_balance')),
      'total_fee_10k_pct':dec_pct(val(row,'total_fees_and_costs_charged_10_000_account_balance')),
      'total_fee_25k_pct':dec_pct(val(row,'total_fees_and_costs_charged_25_000_account_balance')),
      'total_fee_50k_pct':dec_pct(val(row,'total_fees_and_costs_charged_50_000_account_balance')),
      'total_fee_100k_pct':dec_pct(val(row,'total_fees_and_costs_charged_100_000_account_balance')),
      'total_fee_250k_pct':dec_pct(val(row,'total_fees_and_costs_charged_250_000_account_balance')),
    }
    # MySuper adds representative-member net return columns.
    if my:
      rec.update({
        'member_net_return_10y_50k_pct':dec_pct(val(row,'10_year_net_return_50_000_rep_member_p_a')),
        'member_net_return_7y_50k_pct':dec_pct(val(row,'7_year_net_return_50_000_rep_member_p_a')),
        'member_net_return_5y_50k_pct':dec_pct(val(row,'5_year_net_return_50_000_rep_member_p_a')),
        'member_net_return_3y_50k_pct':dec_pct(val(row,'3_year_net_return_50_000_rep_member_p_a')),
      })
    return rec

def main():
    page=fetch(PAGE).decode('utf-8','replace');p=Links();p.feed(page)
    urls=[]
    for href in p.items:
      u=urllib.parse.urljoin(PAGE,href)
      if '.csv' in u.lower() and '2026' in urllib.parse.unquote(u).lower() and 'cppp' in urllib.parse.unquote(u).lower():
        if u not in urls:urls.append(u)
    records=[];files=[]
    for u in urls:
      kind=classify(u)
      if kind=='unknown':continue
      body=fetch(u);reader=csv.DictReader(io.StringIO(body.decode('utf-8-sig','replace')))
      count=0
      for row in reader:
        records.append(normalise(row,kind,u));count+=1
      files.append({'type':kind,'url':u,'rows':count,'bytes':len(body)})
      print(kind,count,flush=True)
    if {x['type'] for x in files}!={'mysuper','non_platform_tdp','platform_tdp','non_platform_edp'}:
      raise RuntimeError(f'Missing expected CPPP classes: {files}')
    generated=datetime.now(timezone.utc).isoformat()
    payload={'schema_version':1,'release_date':'2026-08-28','generated_at':generated,'source_page':PAGE,'files':files,'records':records}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    passes=sum(1 for x in records if x['pass_fail_indicator']=='Pass')
    fails=sum(1 for x in records if x['pass_fail_indicator']=='Fail')
    stats={'schema_version':1,'release_date':'2026-08-28','records':len(records),'records_by_type':{k:sum(1 for x in records if x['cppp_type']==k) for k in ['mysuper','non_platform_tdp','platform_tdp','non_platform_edp']},'pass_rows':passes,'fail_rows':fails,'source_reported_offerings':742,'source_reported_performance_tested_offerings':547,'source_reported_failures':12,'note':'File rows include lifecycle stages and pathway-level observations and therefore are not the same as APRA headline offering counts.'}
    STATS.write_text(json.dumps(stats,indent=2),encoding='utf-8')
    if len(records)<700:raise RuntimeError(f'Unexpectedly low CPPP row count: {len(records)}')
    print('VALIDATED',json.dumps(stats,sort_keys=True),flush=True)

if __name__=='__main__':main()
