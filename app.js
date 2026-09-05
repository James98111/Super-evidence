const FALLBACK_URL = './data/options.json';
const SUPABASE_URL = 'https://oaojblmkvhfeepebllxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_65GUUh10TfMgrtvdnQqC8A_mSXUThco';

let db = { options: [], meta: {}, origin: 'loading' };
let state = {
  view: 'home', fund: null, option: null, topic: 'intro',
  compareA: null, compareB: null,
  rankCategory: 'high-growth', rankPeriod: '10y', rankSort: 'return'
};

const $ = s => document.querySelector(s);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? null : Number(v);
const money = v => v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v));
const pct = (v, digits=2) => v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(digits).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')}%`;
const pp = v => `${Number(v).toFixed(2).replace(/\.00$/,'')} pp`;
const options = () => db.options || [];
const option = id => options().find(o => o.id === id);
const balance = () => Number(localStorage.getItem('se_balance') || 100000);
const funds = () => [...new Map(options().map(o => [o.fund, o])).values()];

function yearsLabel(v){
  const x=n(v); if(x===null) return 'Not yet verified';
  if(x<1) return 'Less than 1 year';
  return `${Number.isInteger(x)?x:x.toFixed(1)}+ years`;
}
function statusLabel(s){
  return ({issuer_verified:'Issuer verified',regulator_verified:'Regulator verified',dual_verified:'Dual verified',secondary_crosscheck:'Secondary cross-check',apra_crosscheck:'APRA cross-check',methodology_difference:'Methodology difference',discrepancy:'Discrepancy',derived:'Calculated'})[s] || 'Not yet verified';
}
function sourceStatus(m){ return m?.status ? statusLabel(m.status) : 'Not yet verified'; }
function perfValue(o,key){ return n(o?.performance?.[key]?.value); }
function growthValue(o){ return n(o.issuerGrowth ?? o.growth ?? o.standardisedGrowthActual); }
function defensiveValue(o){
  const v=n(o.issuerDefensive ?? o.defensive);
  if(v!==null) return v;
  const g=growthValue(o); return g===null?null:100-g;
}
function growthKind(o){
  if(n(o.issuerGrowth)!==null) return 'Issuer reported';
  if(n(o.standardisedGrowthActual)!==null) return 'APRA-standardised actual';
  return 'Not yet classified';
}
function fee(o,b){
  const c=o?.costs || {};
  const adminRate=n(c.adminPercent?.value) || 0;
  const capBalance=n(c.adminPercent?.capBalance);
  const annualCap=n(c.adminPercent?.annualCap);
  let adminPct = b * adminRate / 100;
  if(capBalance!==null) adminPct = Math.min(b,capBalance) * adminRate / 100;
  if(annualCap!==null) adminPct = Math.min(adminPct,annualCap);
  const fixed=n(c.adminFixedAnnual?.value)||0;
  const reserve=b*(n(c.reservePercent?.value)||0)/100;
  const invest=b*(n(c.investmentAndTransactionPct?.value)||0)/100;
  return {adminPct,fixed,reserve,invest,total:adminPct+fixed+reserve+invest};
}
function compoundIllustration(rate,years=10,start=100000){
  const r=n(rate); return r===null?null:start*Math.pow(1+r/100,years);
}
function comparisonFit(a,b){
  if(!a||!b) return {ok:false,text:'Choose two options.'};
  if(a.option_type && b.option_type && a.option_type!==b.option_type) return {ok:false,text:'These are different investment types, so a simple return ranking is not like-for-like.'};
  const ga=growthValue(a), gb=growthValue(b);
  if(ga!==null && gb!==null && Math.abs(ga-gb)>10) return {ok:false,text:`Growth exposure differs by ${Math.abs(ga-gb).toFixed(1)} percentage points, so interpret return differences cautiously.`};
  return {ok:true,text:'These options are broadly similar enough for a useful factual comparison, although their portfolios are not identical.'};
}

async function supa(path){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Accept:'application/json'}});
  if(!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}
function groupBy(rows,key){
  const m=new Map();
  for(const row of rows){ const k=String(row[key]); if(!m.has(k))m.set(k,[]); m.get(k).push(row); }
  return m;
}
function normalizeDatabase(dataset,performance,allocations,fees){
  const perfMap=groupBy(performance,'option_id');
  const allocMap=groupBy(allocations,'option_id');
  const feeMap=groupBy(fees,'pathway_id');
  const keyMap={12:'1y',36:'3y',60:'5y',84:'7y',120:'10y'};
  return dataset.map(r=>{
    const pRows=perfMap.get(String(r.id))||[];
    const p={};
    for(const row of pRows){
      const k=keyMap[Number(row.period_months)]; if(!k) continue;
      p[k]={value:n(row.return_pct),status:row.verification_status,sourceUrl:row.source_url,reportingDate:row.reporting_date,sourceTitle:row.source_title,sourceOrganisation:row.source_organisation};
    }
    for(const k of ['1y','3y','5y','7y','10y']) if(!p[k]) p[k]={value:null,status:'unverified'};
    const fRows=feeMap.get(String(r.pathway_id))||[];
    const byName=name=>fRows.find(x=>x.fee_name===name);
    const investment=byName('Investment + transaction costs');
    const fixed=byName('Account keeping fee');
    const admin=byName('Asset-based administration fee');
    const reserve=byName('Administration costs met from reserves');
    const aRows=allocMap.get(String(r.id))||[];
    const evidenceAlloc=aRows.find(x=>x.allocation_type==='actual')||aRows.find(x=>x.allocation_type==='strategic');
    return {
      id:String(r.id), pathwayId:r.pathway_id, fund:r.fund, product:r.product||'Product not yet mapped', option:r.option,
      style:r.style||'Investment option', option_type:r.option_type, management_style:r.management_style,
      suggestedTimeframe:yearsLabel(r.minimum_suggested_timeframe_years), risk:r.risk||'Not yet verified', objective:r.objective||null,
      issuerGrowth:n(r.issuer_growth_pct), issuerDefensive:n(r.issuer_defensive_pct),
      standardisedGrowthActual:n(r.actual_standardised_growth_pct), standardisedGrowthStrategic:n(r.strategic_standardised_growth_pct),
      standardisedGrowthActualAssumption:!!r.actual_standardised_growth_assumption,
      standardisedGrowthStrategicAssumption:!!r.strategic_standardised_growth_assumption,
      growth:n(r.issuer_growth_pct) ?? n(r.actual_standardised_growth_pct),
      defensive:n(r.issuer_defensive_pct) ?? (n(r.issuer_growth_pct)!==null ? 100-n(r.issuer_growth_pct) : null),
      currencyExposure:n(r.currency_exposure_pct), optionAssets:n(r.option_assets_aud), latestDataDate:r.latest_data_date,
      performance:p,
      costs:{
        adminFixedAnnual:{value:n(r.admin_fixed_annual)||0,status:fixed?.verification_status||'unverified',sourceUrl:fixed?.source_url},
        adminPercent:{value:n(r.admin_percent)||0,capBalance:n(r.admin_percent_cap_balance),annualCap:n(r.admin_percent_annual_cap),status:admin?.verification_status||'unverified',sourceUrl:admin?.source_url},
        reservePercent:{value:n(r.reserve_percent)||0,status:reserve?.verification_status||'unverified',sourceUrl:reserve?.source_url},
        investmentAndTransactionPct:{value:n(r.investment_and_transaction_pct)||0,status:investment?.verification_status||'unverified',sourceUrl:investment?.source_url}
      },
      strategic:r.strategic_allocation?{effective:r.strategic_effective_date,reportingDate:r.strategic_reporting_date,allocation:r.strategic_allocation}:null,
      actual:r.actual_allocation?{reportingDate:r.actual_reporting_date,allocation:r.actual_allocation}:null,
      evidence:{performance:pRows,allocations:aRows,fees:fRows,allocationSource:evidenceAlloc?.source_url}
    };
  });
}
function normalizeFallback(raw){
  return (raw.options||[]).map(o=>({
    ...o,
    option_type:(o.style||'').toLowerCase().includes('diversified')?'multi_sector':'single_sector',
    management_style:(o.style||'').toLowerCase().includes('index')?'passive':'active',
    issuerGrowth:n(o.growth), issuerDefensive:n(o.defensive), standardisedGrowthActual:null, standardisedGrowthStrategic:null,
    strategic:o.strategic?.['2026']||Object.values(o.strategic||{}).at(-1)||null,
    evidence:{performance:[],allocations:[],fees:[]}
  }));
}
async function loadData(){
  try{
    const [dataset,performance,allocations,fees]=await Promise.all([
      supa('api_option_dataset?select=*&order=fund.asc,option.asc'),
      supa('api_option_performance?select=*'),
      supa('api_option_allocation?select=*'),
      supa('api_fee_rules?select=*')
    ]);
    if(!dataset.length) throw new Error('Database returned no published options');
    db={options:normalizeDatabase(dataset,performance,allocations,fees),meta:{performanceAsAt:'2026-06-30'},origin:'database'};
  }catch(err){
    console.error('Live database unavailable; using fallback',err);
    const raw=await fetch(FALLBACK_URL).then(r=>{if(!r.ok)throw new Error('Fallback unavailable');return r.json();});
    db={...raw,options:normalizeFallback(raw),origin:'fallback'};
  }
}

function go(view,params={}){ state={...state,view,...params}; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function setActiveNav(){ document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view)); }
function searchResults(q){
  q=q.trim().toLowerCase(); if(!q)return'';
  const matches=options().filter(o=>[o.fund,o.product,o.option,`${o.fund} ${o.option}`].some(x=>(x||'').toLowerCase().includes(q))).slice(0,12);
  if(!matches.length)return'<div class="empty">No match in the verified dataset yet.</div>';
  return matches.map(o=>`<button class="result-button" data-open-option="${esc(o.id)}"><span><strong>${esc(o.fund)} — ${esc(o.option)}</strong><small>${esc(o.product)} · ${esc(o.style)}</small></span><span class="result-kind">Investment option</span></button>`).join('');
}
function categoryOptions(category){
  const all=options();
  if(category==='high-growth') return all.filter(o=>o.option_type==='multi_sector' && growthValue(o)!==null && growthValue(o)>=80 && growthValue(o)<=95);
  if(category==='diversified') return all.filter(o=>o.option_type==='multi_sector');
  if(category==='single-sector') return all.filter(o=>o.option_type==='single_sector');
  return all;
}
function rankRows(){
  const key=state.rankPeriod;
  const rows=[...categoryOptions(state.rankCategory)];
  rows.sort((a,b)=>{
    if(state.rankSort==='cost') return (n(a.costs.investmentAndTransactionPct.value)??Infinity)-(n(b.costs.investmentAndTransactionPct.value)??Infinity);
    if(state.rankSort==='growth') return (growthValue(b)??-Infinity)-(growthValue(a)??-Infinity);
    return (perfValue(b,key)??-Infinity)-(perfValue(a,key)??-Infinity);
  });
  return rows;
}
function performanceSource(o,key){
  const m=o.performance?.[key];
  return m?.sourceUrl?`<a class="text-link" href="${esc(m.sourceUrl)}" target="_blank" rel="noopener">Source ↗</a>`:`<span class="muted">Not yet verified</span>`;
}
function allocationSource(o){
  const url=o.evidence?.allocationSource;
  return url?`<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener">Open allocation source ↗</a>`:'';
}
function feeSource(o){
  const url=o.costs?.investmentAndTransactionPct?.sourceUrl || o.costs?.adminFixedAnnual?.sourceUrl;
  return url?`<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener">Open fee source ↗</a>`:'';
}
function dataOriginNote(){
  return db.origin==='database' ? '<span class="verified">Live database</span>' : '<span class="verified">Static fallback</span>';
}

function home(){
  const ranked=categoryOptions('high-growth').filter(o=>perfValue(o,'10y')!==null).sort((a,b)=>perfValue(b,'10y')-perfValue(a,'10y')).slice(0,6);
  return `<div class="page"><section class="hero"><div class="hero-copy"><span class="eyebrow">Independent Australian super research</span><h1>Understand your super. See how it compares.</h1><p class="lead">Search a fund or investment option, see what you own, what it costs, how it has performed and how it compares with genuinely similar options.</p><div class="hero-search"><label class="search-label" for="homeSearch">Find your fund or investment option</label><div class="search-field"><input id="homeSearch" autocomplete="off" placeholder="Try ‘ART High Growth’ or ‘Aware Super’"><span>⌕</span></div><div id="homeResults" class="inline-results" hidden></div></div><p class="coverage-note">${dataOriginNote()} · ${funds().length} funds · ${options().length} investment options loaded. The architecture is built for full-market coverage.</p></div><aside class="start-panel"><span class="eyebrow">Start here</span><h2>What would you like to do?</h2><div class="start-list"><button class="start-action" data-view="my"><span class="num">01</span><span><strong>Help me understand my super</strong><small>Find your fund, option, fees and performance step by step.</small></span><span class="arrow">→</span></button><button class="start-action" data-view="compare"><span class="num">02</span><span><strong>Compare investment options</strong><small>Put similar options side by side without drowning in data.</small></span><span class="arrow">→</span></button><button class="start-action" data-view="analysis"><span class="num">03</span><span><strong>Explore the economics</strong><small>Go beyond labels into fees, risk, asset mix and methodology.</small></span><span class="arrow">→</span></button></div></aside></section><div class="quick-strip"><div class="quick-item"><strong>Compare like with like</strong><p>Risk, growth exposure and investment type come before rankings.</p></div><div class="quick-item"><strong>Every number has a source</strong><p>Issuer evidence, dates and verification status stay attached to metrics.</p></div><div class="quick-item"><strong>Missing beats made-up</strong><p>If a figure is not strong enough to verify, the site says so.</p></div></div><section class="section"><div class="section-head"><div><span class="eyebrow">Rankings preview</span><h2>Comparable high-growth options with verified 10-year data</h2></div><p>Only diversified options with roughly 80–95% growth exposure and a verified 10-year figure are ranked here.</p></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Investment option</th><th>10-year return</th><th>Growth</th><th>Investment cost</th><th></th></tr></thead><tbody>${ranked.length?ranked.map((o,i)=>`<tr><td class="rank">${i+1}</td><td class="name-cell"><strong>${esc(o.fund)}</strong><small>${esc(o.option)}</small></td><td class="number">${pct(perfValue(o,'10y'))} p.a.</td><td class="number">${pct(growthValue(o),1)}</td><td class="number">${pct(o.costs.investmentAndTransactionPct.value)}</td><td><button class="text-link" data-open-option="${esc(o.id)}">View</button></td></tr>`).join(''):`<tr><td colspan="6">No verified 10-year peers are loaded yet.</td></tr>`}</tbody></table></div></section></div>`;
}

function mySuper(){
  const saved=localStorage.getItem('se_option'); const selected=saved?option(saved):null;
  return `<div class="page narrow"><div class="page-head"><span class="eyebrow">My super</span><h1>Let’s work out what you actually have.</h1><p class="lead">You do not need to know the jargon. Start with your fund and we will narrow it down.</p></div><div class="wizard"><div class="wizard-step"><span class="step-number">1</span><div><h3>Which fund are you with?</h3><p class="muted">Check a payslip, your fund app or myGov/ATO if you are unsure.</p><div class="choices">${funds().map(f=>`<button class="choice" data-pick-fund="${esc(f.fund)}">${esc(f.fund)}</button>`).join('')}<button class="choice">I don’t know</button></div></div></div><div class="wizard-step"><span class="step-number">2</span><div><h3>Which investment option are you in?</h3><p class="muted">Often called Balanced, High Growth, Indexed or a lifecycle option.</p><div id="myOptionChoices" class="choices"><span class="muted">Choose a fund first.</span></div></div></div><div class="wizard-step"><span class="step-number">3</span><div><h3>What is your super balance?</h3><div class="field" style="max-width:220px"><label for="balanceInput">Current balance</label><input id="balanceInput" type="number" min="0" step="1000" value="${balance()}"></div></div></div></div>${selected?`<section class="section"><span class="eyebrow">Saved super</span><h2>${esc(selected.fund)} — ${esc(selected.option)}</h2><p class="muted">Saved balance: ${money(balance())}. Estimated disclosed annual cost: <strong>${money(fee(selected,balance()).total)}</strong>.</p><button class="primary-btn" data-open-option="${esc(selected.id)}">View my investment option</button></section>`:''}</div>`;
}

function rankings(){
  const rows=rankRows(); let rank=0;
  return `<div class="page"><div class="page-head"><span class="eyebrow">Rankings</span><h1>Rank comparable options, not marketing labels.</h1><p class="lead">The ranking universe is filtered before returns are sorted. Missing or unverified history is shown as missing, not back-filled.</p></div><div class="filters"><div class="field"><label>Peer group</label><select id="rankCategory"><option value="high-growth" ${state.rankCategory==='high-growth'?'selected':''}>High growth-like (80–95% growth)</option><option value="diversified" ${state.rankCategory==='diversified'?'selected':''}>All diversified</option><option value="single-sector" ${state.rankCategory==='single-sector'?'selected':''}>Single sector</option><option value="all" ${state.rankCategory==='all'?'selected':''}>All loaded options</option></select></div><div class="field"><label>Period</label><select id="rankPeriod">${[['10y','10 years'],['7y','7 years'],['5y','5 years'],['3y','3 years'],['1y','1 year']].map(([v,l])=>`<option value="${v}" ${state.rankPeriod===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label>Sort by</label><select id="rankSort"><option value="return" ${state.rankSort==='return'?'selected':''}>Return</option><option value="cost" ${state.rankSort==='cost'?'selected':''}>Investment cost</option><option value="growth" ${state.rankSort==='growth'?'selected':''}>Growth exposure</option></select></div></div><div class="callout">A rank is descriptive, not a recommendation. A high return can reflect greater market risk, a different asset mix, currency exposure or a strategy that changed during the measurement period.</div><div class="table-wrap"><table><thead><tr><th>#</th><th>Option</th><th>${esc(state.rankPeriod.replace('y','-year'))}</th><th>Growth</th><th>Cost</th><th>Evidence</th></tr></thead><tbody>${rows.map(o=>{const rv=perfValue(o,state.rankPeriod);if(rv!==null)rank++;return `<tr><td class="rank">${rv!==null?rank:'—'}</td><td class="name-cell"><button class="text-link" data-open-option="${esc(o.id)}">${esc(o.fund)}<br><small>${esc(o.option)}</small></button></td><td class="number">${rv!==null?pct(rv):'Not yet verified'}</td><td class="number">${pct(growthValue(o),1)}</td><td class="number">${pct(o.costs.investmentAndTransactionPct.value)}</td><td><span class="verified">${esc(sourceStatus(o.performance[state.rankPeriod]))}</span></td></tr>`;}).join('')}</tbody></table></div></div>`;
}

function fundsPage(){
  const groups=new Map(); options().forEach(o=>{if(!groups.has(o.fund))groups.set(o.fund,[]);groups.get(o.fund).push(o);});
  return `<div class="page"><div class="page-head"><span class="eyebrow">Funds</span><h1>Funds, products and investment options.</h1><p class="lead">The database follows the real hierarchy underneath super: fund → product → menu → investment option → pathway.</p></div><div class="fund-list">${[...groups.entries()].map(([fund,opts])=>`<div class="fund-row"><div><h3>${esc(fund)}</h3><p>${esc(opts[0].product)}</p></div><div class="fund-options">${opts.map(o=>esc(o.option)).join(' · ')}</div><button class="text-link" data-open-option="${esc(opts[0].id)}">Explore →</button></div>`).join('')}</div></div>`;
}

function compare(){
  const defaultPeers=categoryOptions('high-growth').filter(o=>perfValue(o,'10y')!==null);
  const a=option(state.compareA)||defaultPeers[0]||options()[0];
  const b=option(state.compareB)||defaultPeers[1]||options()[1]||options()[0];
  if(!a||!b)return'';
  const fa=fee(a,balance()),fb=fee(b,balance()),fit=comparisonFit(a,b);
  const ra=perfValue(a,'10y'),rb=perfValue(b,'10y');
  const diff=ra!==null&&rb!==null?ra-rb:null;
  const wa=compoundIllustration(ra),wb=compoundIllustration(rb);
  const wealthDiff=wa!==null&&wb!==null?wa-wb:null;
  return `<div class="page"><div class="page-head"><span class="eyebrow">Compare</span><h1>Side by side, with the economic context.</h1><p class="lead">Compare the investment, not just the fund name. The site flags when the comparison is not genuinely like-for-like.</p></div><div class="compare-picker"><div class="field"><label>Option one</label><select id="compareA">${options().map(o=>`<option value="${esc(o.id)}" ${o.id===a.id?'selected':''}>${esc(o.fund)} — ${esc(o.option)}</option>`).join('')}</select></div><div class="vs">vs</div><div class="field"><label>Option two</label><select id="compareB">${options().map(o=>`<option value="${esc(o.id)}" ${o.id===b.id?'selected':''}>${esc(o.fund)} — ${esc(o.option)}</option>`).join('')}</select></div></div><div class="callout"><strong>${fit.ok?'Broadly comparable':'Comparison caution'}</strong><br>${esc(fit.text)}</div><div class="comparison"><div class="compare-row"><div class="compare-label"></div><div><strong>${esc(a.fund)}</strong><br><span class="muted">${esc(a.option)}</span></div><div><strong>${esc(b.fund)}</strong><br><span class="muted">${esc(b.option)}</span></div></div>${[
    ['10-year return',ra!==null?`${pct(ra)} p.a.`:'Not yet verified',rb!==null?`${pct(rb)} p.a.`:'Not yet verified'],
    ['Issuer growth assets',n(a.issuerGrowth)!==null?pct(a.issuerGrowth,1):'Not published/loaded',n(b.issuerGrowth)!==null?pct(b.issuerGrowth,1):'Not published/loaded'],
    ['APRA-standardised actual',n(a.standardisedGrowthActual)!==null?pct(a.standardisedGrowthActual,2):'Not calculable',n(b.standardisedGrowthActual)!==null?pct(b.standardisedGrowthActual,2):'Not calculable'],
    ['Risk',a.risk,b.risk],['Suggested timeframe',a.suggestedTimeframe,b.suggestedTimeframe],
    [`Est. disclosed cost at ${money(balance())}`,money(fa.total),money(fb.total)]
  ].map(r=>`<div class="compare-row"><div class="compare-label">${esc(r[0])}</div><div class="number">${esc(r[1])}</div><div class="number">${esc(r[2])}</div></div>`).join('')}</div>${diff!==null?`<div class="interpretation"><strong>What the long-run numbers say — and what they do not</strong><p>The published 10-year annualised-return gap is ${pp(Math.abs(diff))}. If ${money(100000)} simply compounded at those two historical average rates for 10 years, the arithmetic difference would be about <strong>${money(Math.abs(wealthDiff))}</strong>. That is an illustration of compounding, not a forecast or an actual member outcome: administration fees, contributions, timing, tax treatment and strategy changes matter.</p></div>`:''}<div class="accordion"><details><summary>Returns and evidence</summary><div class="detail-body">${['1y','3y','5y','7y','10y'].map(k=>`<div class="data-row"><span>${esc(k.replace('y','-year'))} return</span><strong>${pct(perfValue(a,k))} vs ${pct(perfValue(b,k))}</strong></div>`).join('')}</div></details><details><summary>Fees at my balance</summary><div class="detail-body"><div class="data-row"><span>${esc(a.fund)}</span><strong>${money(fa.total)}/year</strong></div><div class="data-row"><span>${esc(b.fund)}</span><strong>${money(fb.total)}/year</strong></div><p class="muted">Reserve-funded costs are included in the disclosed-cost estimate but are not the same as amounts directly deducted from the member account.</p></div></details><details><summary>Portfolio methodology</summary><div class="detail-body"><div class="data-row"><span>${esc(a.fund)}</span><strong>${n(a.issuerGrowth)!==null?pct(a.issuerGrowth,1):'Issuer growth not loaded'} · ${n(a.standardisedGrowthActual)!==null?`${pct(a.standardisedGrowthActual,2)} APRA-standardised actual`:'APRA standardisation not defensible from loaded detail'}</strong></div><div class="data-row"><span>${esc(b.fund)}</span><strong>${n(b.issuerGrowth)!==null?pct(b.issuerGrowth,1):'Issuer growth not loaded'} · ${n(b.standardisedGrowthActual)!==null?`${pct(b.standardisedGrowthActual,2)} APRA-standardised actual`:'APRA standardisation not defensible from loaded detail'}</strong></div></div></details></div></div>`;
}

function economicLens(o){
  const g=n(o.issuerGrowth),sg=n(o.standardisedGrowthActual),cost=n(o.costs.investmentAndTransactionPct.value),b=balance();
  let growthText='There is not yet enough granular allocation data to calculate a standardised growth exposure.';
  if(g!==null&&sg!==null){const d=sg-g;growthText=`The issuer reports ${pct(g,1)} growth assets, while the APRA-style classification of the latest actual portfolio is ${pct(sg,2)} — ${Math.abs(d).toFixed(2)} percentage points ${d>0?'higher':'lower'}. This is a methodology difference, not automatically a data error.`;}
  else if(g!==null&&o.fund==='Australian Retirement Trust'&&o.option==='High Growth') growthText=`ART reports about ${pct(g,1)} growth assets. We deliberately do not manufacture an APRA-standardised figure from ART's aggregated “Unlisted assets & alternatives” bucket because its sub-assets carry different APRA growth weights.`;
  return `<div class="callout"><strong>Economic lens</strong><p>${esc(growthText)}</p>${cost!==null?`<p>At ${money(b)}, the current investment and transaction cost alone is about <strong>${money(b*cost/100)}/year</strong>. That is a certain cost; any claimed return advantage is uncertain and must be assessed over a comparable risk horizon.</p>`:''}</div>`;
}

function optionPage(id){
  const o=option(id)||options()[0]; if(!o)return'';
  const f=fee(o,balance()); const allocation=o.actual||o.strategic;
  const allocationLabel=o.actual?`Actual allocation at ${o.actual.reportingDate}`:o.strategic?`Strategic allocation effective ${o.strategic.effective}`:'Allocation not yet loaded';
  const g=growthValue(o),d=defensiveValue(o);
  return `<div class="page"><div class="breadcrumb"><button data-view="funds">Funds</button> / ${esc(o.fund)} / ${esc(o.product)}</div><section class="option-header"><div class="option-header-row"><div><span class="eyebrow">Investment option</span><h1>${esc(o.option)}</h1><p class="option-summary">${esc(o.fund)} · ${esc(o.style)}. ${g!==null?`${pct(g,1)} growth exposure shown using ${growthKind(o).toLowerCase()}.`:'Growth exposure is not yet sufficiently verified.'}</p></div><button class="secondary-btn" data-compare-option="${esc(o.id)}">Compare this option</button></div><div class="metric-strip"><div class="metric"><label>10-year return</label><strong>${pct(perfValue(o,'10y'))}</strong><small>${perfValue(o,'10y')!==null?'p.a.':'Not yet verified'}</small></div><div class="metric"><label>Estimated annual cost</label><strong>${money(f.total)}</strong><small>at ${money(balance())}</small></div><div class="metric"><label>Growth exposure</label><strong>${pct(g,1)}</strong><small>${esc(growthKind(o))}${d!==null?` · ${pct(d,1)} defensive`:''}</small></div><div class="metric"><label>Risk</label><strong>${esc(o.risk)}</strong><small>Fund disclosure where loaded</small></div><div class="metric"><label>Suggested timeframe</label><strong>${esc(o.suggestedTimeframe)}</strong><small>Fund guidance where loaded</small></div></div></section>${economicLens(o)}<div class="accordion"><details open><summary>How has it performed?</summary><div class="detail-body">${['1y','3y','5y','7y','10y'].map(k=>`<div class="data-row"><span>${esc(k.replace('y','-year'))} return</span><strong>${pct(perfValue(o,k))} <small class="verified">${esc(sourceStatus(o.performance[k]))}</small></strong><span>${performanceSource(o,k)}</span></div>`).join('')}<div class="callout">Longer periods are more informative for long-term options, but only if the strategy remained sufficiently comparable. Past performance is not a forecast.</div></div></details><details><summary>What does your money actually own?</summary><div class="detail-body"><div class="data-row"><span>Issuer-reported growth</span><strong>${pct(o.issuerGrowth,1)}</strong></div><div class="data-row"><span>APRA-standardised actual growth</span><strong>${pct(o.standardisedGrowthActual,2)}${o.standardisedGrowthActualAssumption?' *':''}</strong></div>${o.standardisedGrowthActualAssumption?`<p class="muted">* Uses APRA's 50/50 listed/unlisted assumption where property or infrastructure listing status is not specified.</p>`:''}<p class="muted">${esc(allocationLabel)}</p>${allocation?.allocation?.length?allocation.allocation.map(([name,v])=>`<div class="data-row"><span>${esc(name)}</span><strong>${pct(v,2)}</strong></div>`).join(''):`<p class="muted">No sufficiently verified allocation snapshot is loaded for this option yet.</p>`}${o.currencyExposure!==null&&o.currencyExposure!==undefined?`<div class="data-row"><span>Foreign currency exposure</span><strong>${pct(o.currencyExposure,1)}</strong></div>`:''}${allocationSource(o)}</div></details><details><summary>What does it cost?</summary><div class="detail-body"><div class="field" style="max-width:240px"><label for="optionBalance">Balance used for estimate</label><input id="optionBalance" type="number" min="0" step="1000" value="${balance()}"></div><div id="optionFeeRows"><div class="data-row"><span>Account keeping</span><strong>${money(f.fixed)}</strong></div><div class="data-row"><span>Asset-based administration</span><strong>${money(f.adminPct)}</strong></div><div class="data-row"><span>Investment + transaction</span><strong>${money(f.invest)}</strong></div><div class="data-row"><span>Costs met from reserves</span><strong>${money(f.reserve)}</strong></div><div class="data-row"><span><strong>Estimated disclosed annual cost</strong></span><strong>${money(f.total)}</strong></div></div><p class="muted">Insurance, advice and member-specific activity costs are excluded. Reserve-funded costs are labelled separately because they are not directly deducted in the same way as account fees.</p>${feeSource(o)}</div></details><details><summary>Economic analysis</summary><div class="detail-body"><div class="data-row"><span>Management style</span><strong>${esc(o.management_style||'Not yet classified')}</strong></div><div class="data-row"><span>Investment type</span><strong>${esc((o.option_type||'unknown').replaceAll('_',' '))}</strong></div><div class="data-row"><span>Issuer growth vs standardised actual</span><strong>${n(o.issuerGrowth)!==null&&n(o.standardisedGrowthActual)!==null?`${pct(o.issuerGrowth,1)} vs ${pct(o.standardisedGrowthActual,2)}`:'Not yet jointly calculable'}</strong></div><div class="data-row"><span>Real return after inflation</span><strong>Pending matched ABS CPI series</strong></div><div class="data-row"><span>Return vs SAA benchmark</span><strong>Pending market-wide APRA benchmark ingest</strong></div><p class="muted">The site will not calculate real returns, alpha or risk-adjusted rankings until the required matching time series and benchmark definitions are loaded.</p></div></details><details><summary>Evidence and data status</summary><div class="detail-body"><div class="data-row"><span>Latest loaded data date</span><strong>${esc(o.latestDataDate||'Varies by source')}</strong></div><div class="data-row"><span>Database source</span><strong>${db.origin==='database'?'Live evidence ledger':'Static fallback'}</strong></div><div class="data-row"><span>Performance observations</span><strong>${o.evidence.performance.length}</strong></div><div class="data-row"><span>Allocation observations</span><strong>${o.evidence.allocations.length}</strong></div><div class="data-row"><span>Fee rules</span><strong>${o.evidence.fees.length}</strong></div></div></details></div></div>`;
}

function analysisPage(){
  const art=options().find(o=>o.fund==='Australian Retirement Trust'&&o.option==='High Growth');
  const aware=options().find(o=>o.fund==='Aware Super'&&o.option==='High Growth');
  const artIdx=options().find(o=>o.fund==='Australian Retirement Trust'&&o.option==='High Growth Index');
  const awareIdx=options().find(o=>o.fund==='Aware Super'&&o.option==='High Growth Indexed');
  const b=balance();
  const awareGap=aware&&n(aware.standardisedGrowthActual)!==null&&n(aware.issuerGrowth)!==null?aware.standardisedGrowthActual-aware.issuerGrowth:null;
  return `<div class="page"><div class="page-head"><span class="eyebrow">Analysis</span><h1>Go beyond the league table.</h1><p class="lead">The goal is to explain the economics behind super outcomes: risk exposure, fees, benchmark performance, strategy changes, scale and member outcomes — without pretending correlation is causation.</p></div><div class="quick-strip"><div class="quick-item"><strong>${awareGap!==null?`+${awareGap.toFixed(2)} pp`:'—'}</strong><p>Aware High Growth: APRA-style actual growth exposure above the issuer's 88% label. Different methodology, not necessarily bad data.</p></div><div class="quick-item"><strong>${art&&artIdx?pp(art.costs.investmentAndTransactionPct.value-artIdx.costs.investmentAndTransactionPct.value):'—'}</strong><p>ART active High Growth vs High Growth Index investment-cost gap. At ${money(b)}, roughly ${art&&artIdx?money(b*(art.costs.investmentAndTransactionPct.value-artIdx.costs.investmentAndTransactionPct.value)/100):'—'} a year.</p></div><div class="quick-item"><strong>${aware&&awareIdx?pp(aware.costs.investmentAndTransactionPct.value-awareIdx.costs.investmentAndTransactionPct.value):'—'}</strong><p>Aware active High Growth vs High Growth Indexed investment-cost gap. Cost is observable; future excess return is not.</p></div></div><section class="section"><div class="section-head"><div><span class="eyebrow">Economic framework</span><h2>Questions the platform should answer</h2></div><p>Each answer needs matched definitions, dates and peer groups before it earns a number.</p></div><div class="table-wrap"><table><thead><tr><th>Question</th><th>Current status</th><th>Economic discipline</th></tr></thead><tbody><tr><td><strong>Is a fund expensive?</strong></td><td>Working now</td><td>Calculate fees in dollars at the same balance and effective date; separate account deductions from reserve-funded costs.</td></tr><tr><td><strong>Has it performed well?</strong></td><td>Partly working</td><td>Compare like-risk options over matched horizons; don't reward a higher-risk portfolio for simply taking more market risk.</td></tr><tr><td><strong>What is the real return?</strong></td><td>Next data layer</td><td>Use matched ABS CPI and compound Fisher adjustment, not nominal return minus inflation.</td></tr><tr><td><strong>Did active management add value?</strong></td><td>Needs benchmarks/history</td><td>Compare after-fee return with SAA/reference benchmark over the same period and account for changing asset allocation.</td></tr><tr><td><strong>Does fund scale lower costs?</strong></td><td>Needs APRA fund-level ingest</td><td>Study assets/members versus administration economics; correlation alone does not prove economies of scale caused lower fees.</td></tr><tr><td><strong>Are unlisted assets less risky?</strong></td><td>Needs time-series analysis</td><td>Reported volatility can be dampened by appraisal smoothing; don't equate smoother marks with lower economic risk.</td></tr></tbody></table></div></section><section class="section"><div class="section-head"><div><span class="eyebrow">Data integrity</span><h2>What the database refuses to fake</h2></div></div><div class="callout"><strong>ART High Growth is the current test case.</strong><p>ART reports about 85% growth assets, but its 32% “Unlisted assets & alternatives” strategic bucket spans assets with different APRA growth weights. The database therefore leaves APRA-standardised growth blank rather than choosing a convenient assumption.</p></div><div class="callout"><strong>Aware High Growth demonstrates a valid methodology difference.</strong><p>Aware reports 88% growth. The APRA-style classification of its 30 June 2026 actual asset mix is about ${aware?pct(aware.standardisedGrowthActual,2):'—'}. Both figures can be correct because the classification rules differ.</p></div></section></div>`;
}

function learnPage(){
  const topics={intro:['Start here','Your super fund is the provider. Your investment option is the portfolio inside it. Two people in the same fund can own very different investments.'],growth:['Growth assets','Growth exposure is more informative than labels like “Balanced” or “High Growth”. More growth usually means more short-term volatility and greater expected long-run return, not a guarantee of better outcomes.'],returns:['Returns','One year can be noise. Long horizons are more useful, but only when the investment strategy over that history remains comparable with what exists today.'],fees:['Fees','Small percentage fees compound. Compare them in dollars at the same balance, and distinguish costs deducted from your account from costs paid from fund reserves.'],evidence:['Evidence','Every displayed number should carry a source, reporting/effective date and verification status. A missing primary-source figure is better than a confident-looking secondary estimate.']};
  const [title,text]=topics[state.topic]||topics.intro;
  return `<div class="page"><div class="page-head"><span class="eyebrow">Learn</span><h1>Understand super while you use it.</h1><p class="lead">Short explanations first. Methodology and evidence when you want to go deeper.</p></div><div class="learn-layout"><nav class="learn-nav">${Object.entries(topics).map(([k,v])=>`<button data-topic="${k}" class="${state.topic===k?'active':''}">${esc(v[0])}</button>`).join('')}</nav><article class="learn-article"><h2>${esc(title)}</h2><p>${esc(text)}</p></article></div></div>`;
}

function render(){
  setActiveNav();
  const app=$('#app');
  const view={home, my:mySuper, compare, rankings, funds:fundsPage, analysis:analysisPage, learn:learnPage}[state.view]||home;
  app.innerHTML=state.view==='option'?optionPage(state.option):view();
  bind();
}
function bind(){
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
  document.querySelectorAll('[data-open-option]').forEach(b=>b.onclick=()=>go('option',{option:b.dataset.openOption}));
  document.querySelectorAll('[data-compare-option]').forEach(b=>b.onclick=()=>go('compare',{compareA:b.dataset.compareOption}));
  const homeSearch=$('#homeSearch'); if(homeSearch){homeSearch.oninput=()=>{const r=$('#homeResults');r.innerHTML=searchResults(homeSearch.value);r.hidden=!homeSearch.value.trim();document.querySelectorAll('[data-open-option]').forEach(b=>b.onclick=()=>go('option',{option:b.dataset.openOption}));};}
  document.querySelectorAll('[data-pick-fund]').forEach(b=>b.onclick=()=>{const box=$('#myOptionChoices');const list=options().filter(o=>o.fund===b.dataset.pickFund);box.innerHTML=list.map(o=>`<button class="choice" data-save-option="${esc(o.id)}">${esc(o.option)}</button>`).join('');box.querySelectorAll('[data-save-option]').forEach(x=>x.onclick=()=>{localStorage.setItem('se_option',x.dataset.saveOption);go('my');});});
  const bal=$('#balanceInput'); if(bal) bal.onchange=()=>{localStorage.setItem('se_balance',String(Math.max(0,Number(bal.value)||0)));render();};
  const optionBal=$('#optionBalance'); if(optionBal) optionBal.onchange=()=>{localStorage.setItem('se_balance',String(Math.max(0,Number(optionBal.value)||0)));render();};
  const ca=$('#compareA'),cb=$('#compareB'); if(ca)ca.onchange=()=>{state.compareA=ca.value;render();}; if(cb)cb.onchange=()=>{state.compareB=cb.value;render();};
  const rc=$('#rankCategory'),rp=$('#rankPeriod'),rs=$('#rankSort');
  if(rc)rc.onchange=()=>{state.rankCategory=rc.value;render();}; if(rp)rp.onchange=()=>{state.rankPeriod=rp.value;render();}; if(rs)rs.onchange=()=>{state.rankSort=rs.value;render();};
  document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{state.topic=b.dataset.topic;render();});
}
function bindGlobalSearch(){
  const dlg=$('#searchDialog'),open=$('#globalSearchButton'),close=$('#closeSearch'),input=$('#dialogSearchInput'),results=$('#dialogSearchResults');
  open.onclick=()=>{dlg.showModal();input.value='';results.innerHTML='<div class="empty">Start typing a fund or option name.</div>';setTimeout(()=>input.focus(),20);};
  close.onclick=()=>dlg.close();
  input.oninput=()=>{results.innerHTML=searchResults(input.value);results.querySelectorAll('[data-open-option]').forEach(b=>b.onclick=()=>{dlg.close();go('option',{option:b.dataset.openOption});});};
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
}

async function init(){
  $('#app').innerHTML='<div class="page"><div class="page-head"><span class="eyebrow">Loading</span><h1>Loading the evidence database…</h1></div></div>';
  await loadData();
  bindGlobalSearch();
  render();
}
init().catch(err=>{$('#app').innerHTML=`<div class="page"><div class="callout"><strong>Unable to load Super Evidence</strong><p>${esc(err.message)}</p></div></div>`;console.error(err);});
