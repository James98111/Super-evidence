const FALLBACK_URL='./data/options.json';
const SUPABASE_URL='https://oaojblmkvhfeepebllxr.supabase.co';
const SUPABASE_KEY='sb_publishable_65GUUh10TfMgrtvdnQqC8A_mSXUThco';

let db={options:[],origin:'loading'};
let state={view:'home',fund:null,option:null,compareA:null,compareB:null,topic:'intro'};

const $=s=>document.querySelector(s);
const n=v=>(v===null||v===undefined||v===''||Number.isNaN(Number(v)))?null:Number(v);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>n(v)===null?'—':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(n(v));
const pct=(v,d=2)=>n(v)===null?'—':`${n(v).toFixed(d).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')}%`;
const options=()=>db.options||[];
const option=id=>options().find(o=>o.id===id);
const fundNames=()=>[...new Set(options().map(o=>o.fund))].sort();
const fundOptions=fund=>options().filter(o=>o.fund===fund);
const balance=()=>Number(localStorage.getItem('se_balance')||100000);
const icon=id=>`<svg aria-hidden="true" viewBox="0 0 32 32"><use href="assets/icons.svg#${id}"></use></svg>`;

const FUND_PROFILES={
  'Aware Super': 'Explore Aware Super’s investment menu, including diversified, indexed, socially conscious and single-asset options currently verified in Super Evidence.',
  'Australian Retirement Trust': 'Explore Australian Retirement Trust’s Super Savings investment menu and compare its diversified, indexed and single-asset options using the same measures.'
};
const marketShelf=['AustralianSuper','Australian Retirement Trust','Hostplus','UniSuper','Aware Super','Rest','HESTA','Cbus'];

function yearsLabel(v){const x=n(v);return x===null?'Not yet verified':`${Number.isInteger(x)?x:x.toFixed(1)}+ years`}
function perf(o,k){return n(o?.performance?.[k]?.value)}
function growth(o){return n(o?.issuerGrowth??o?.standardisedGrowthActual??o?.growth)}
function defensive(o){return n(o?.issuerDefensive??o?.defensive)??(growth(o)!==null?100-growth(o):null)}
function fee(o,b){
  const c=o?.costs||{},rate=n(c.adminPercent?.value)||0,cap=n(c.adminPercent?.capBalance),annual=n(c.adminPercent?.annualCap);
  let ap=b*rate/100;if(cap!==null)ap=Math.min(b,cap)*rate/100;if(annual!==null)ap=Math.min(ap,annual);
  const fixed=n(c.adminFixedAnnual?.value)||0,reserve=b*(n(c.reservePercent?.value)||0)/100,invest=b*(n(c.investmentAndTransactionPct?.value)||0)/100;
  return{ap,fixed,reserve,invest,total:ap+fixed+reserve+invest};
}

async function supa(path){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Accept:'application/json'}});if(!r.ok)throw new Error(`Supabase ${r.status}`);return r.json()}
function groupBy(rows,key){const m=new Map();for(const r of rows){const k=String(r[key]);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return m}
function normalizeDatabase(dataset,performance,allocations,fees){
  const pm=groupBy(performance,'option_id'),am=groupBy(allocations,'option_id'),fm=groupBy(fees,'pathway_id'),keys={12:'1y',36:'3y',60:'5y',84:'7y',120:'10y'};
  return dataset.map(r=>{
    const p={};for(const row of pm.get(String(r.id))||[]){const k=keys[Number(row.period_months)];if(k)p[k]={value:n(row.return_pct),status:row.verification_status,sourceUrl:row.source_url}}
    for(const k of ['1y','3y','5y','7y','10y'])if(!p[k])p[k]={value:null,status:'unverified'};
    const fr=fm.get(String(r.pathway_id))||[],by=x=>fr.find(y=>y.fee_name===x),actual=(am.get(String(r.id))||[]).filter(x=>x.allocation_type==='actual'),strategic=(am.get(String(r.id))||[]).filter(x=>x.allocation_type==='strategic');
    return{id:String(r.id),pathwayId:r.pathway_id,fund:r.fund,product:r.product||'Super product',option:r.option,style:r.style||'Investment option',option_type:r.option_type,management_style:r.management_style,risk:r.risk||'Not yet verified',suggestedTimeframe:yearsLabel(r.minimum_suggested_timeframe_years),issuerGrowth:n(r.issuer_growth_pct),issuerDefensive:n(r.issuer_defensive_pct),standardisedGrowthActual:n(r.actual_standardised_growth_pct),performance:p,costs:{adminFixedAnnual:{value:n(r.admin_fixed_annual)||0,sourceUrl:by('Account keeping fee')?.source_url},adminPercent:{value:n(r.admin_percent)||0,capBalance:n(r.admin_percent_cap_balance),annualCap:n(r.admin_percent_annual_cap)},reservePercent:{value:n(r.reserve_percent)||0},investmentAndTransactionPct:{value:n(r.investment_and_transaction_pct)||0,sourceUrl:by('Investment + transaction costs')?.source_url}},actual:actual.length?{reportingDate:actual[0].reporting_date,allocation:actual.map(x=>[x.raw_asset_label,n(x.allocation_pct)])}:null,strategic:strategic.length?{reportingDate:strategic[0].reporting_date,effective:strategic[0].effective_date,allocation:strategic.map(x=>[x.raw_asset_label,n(x.allocation_pct)])}:null,latestDataDate:r.latest_data_date};
  });
}
function normalizeFallback(raw){return(raw.options||[]).map(o=>({...o,id:String(o.id),issuerGrowth:n(o.growth),issuerDefensive:n(o.defensive),standardisedGrowthActual:null,actual:null,strategic:o.strategic?.['2026']||null}))}
async function loadData(){
  try{
    const[d,p,a,f]=await Promise.all([supa('api_option_dataset?select=*&order=fund.asc,option.asc'),supa('api_option_performance?select=*'),supa('api_option_allocation?select=*'),supa('api_fee_rules?select=*')]);
    db={options:normalizeDatabase(d,p,a,f),origin:'database'};
  }catch(e){
    console.warn(e);const raw=await fetch(FALLBACK_URL).then(r=>r.json());db={options:normalizeFallback(raw),origin:'fallback'};
  }
}

function go(view,params={}){state={...state,view,...params};render();window.scrollTo({top:0,behavior:'smooth'})}
function setActive(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view))}
function initials(name){return name.split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase()}

function fundSearchResults(q){
  q=q.trim().toLowerCase();if(!q)return'';
  const rows=fundNames().filter(f=>f.toLowerCase().includes(q)).slice(0,10);
  return rows.length?rows.map(f=>`<button class="result-button fund-result" data-open-fund="${esc(f)}"><span class="fund-result-mark">${esc(initials(f))}</span><span class="fund-result-copy"><strong>${esc(f)}</strong><small>${fundOptions(f).length} investment options currently loaded</small></span><span class="result-kind">Fund →</span></button>`).join(''):'<div class="empty">No fund match in the verified dataset yet.</div>';
}

function home(){
  return`<div class="home"><section class="home-hero"><div class="hero-copy"><span class="eyebrow">Independent Australian super research</span><h1>Understand your super with confidence.</h1><p class="lead">Independent, easy-to-understand information about Australia’s super funds and investment options.</p><div class="hero-search"><div class="search-field">${icon('search')}<input id="homeSearch" placeholder="Search a super fund" autocomplete="off"><button id="homeSearchButton">Search</button></div><div id="homeResults" class="inline-results" hidden></div></div></div><div class="hero-photo" role="img" aria-label="Professional working from home in natural light"></div></section><section class="home-actions"><button class="home-action" data-view="funds"><span class="icon-orb">${icon('search')}</span><span><h3>Find a fund</h3><p>Browse a fund first, then see every investment option available inside it.</p><span class="arrow-link">→</span></span></button><button class="home-action" data-view="compare"><span class="icon-orb">${icon('compare')}</span><span><h3>Compare portfolios</h3><p>Choose two funds and options, then compare returns, risk, fees and what they invest in.</p><span class="arrow-link">→</span></span></button><button class="home-action" data-view="learn"><span class="icon-orb">${icon('learn')}</span><span><h3>Learn about super</h3><p>Plain-English guides from the basics through to more advanced concepts.</p><span class="arrow-link">→</span></span></button></section><section class="home-funds"><div class="section-head"><div><span class="eyebrow">Australia’s super market</span><h2>Explore Australia’s super funds</h2></div><button class="section-link" data-view="funds">View all funds →</button></div><div class="fund-shelf">${marketShelf.map(name=>fundNames().includes(name)?`<button class="fund-wordmark active-fund" data-open-fund="${esc(name)}">${esc(name)}<small>${fundOptions(name).length} options loaded</small></button>`:`<span class="fund-wordmark muted-fund">${esc(name)}<small>Coverage expanding</small></span>`).join('')}</div></section><section class="home-calculators"><div class="calc-intro"><span class="eyebrow">Calculators</span><h2>See what your super could be.</h2><p>Explore scenarios using transparent assumptions you can see and change.</p><button class="section-link" data-view="calculators">Explore calculators →</button></div><button class="calc-feature" data-view="calculators"><span>${icon('calculator')}</span><span><h3>Super projection calculator</h3><p>See how a balance could grow over time using explicit assumptions for returns, fees, inflation and contributions.</p></span><span class="arrow-link">→</span></button></section></div>`;
}

function fundsPage(){
  const groups=fundNames().map(f=>[f,fundOptions(f)]);
  return`<div class="page"><div class="page-head"><span class="eyebrow">Find a fund</span><h1>Explore the super market.</h1><p class="lead">Choose a super fund first. Inside each fund you can see its investment options, performance, risk, fees and portfolio allocations.</p></div><div class="fund-directory">${groups.map(([fund,opts])=>`<button class="fund-directory-row" data-open-fund="${esc(fund)}"><span class="fund-directory-mark">${esc(initials(fund))}</span><span><strong>${esc(fund)}</strong><small>${opts.length} investment options loaded · ${[...new Set(opts.map(o=>o.product))].join(' · ')}</small></span><span>Explore fund →</span></button>`).join('')}</div></div>`;
}

function groupLabel(o){
  if(o.option_type==='single_sector')return'Single asset & specialist';
  if(o.management_style==='passive')return'Indexed diversified';
  return'Diversified options';
}
function fundStats(opts){
  const costs=opts.map(o=>n(o.costs?.investmentAndTransactionPct?.value)).filter(x=>x!==null);
  const perfCount=opts.filter(o=>perf(o,'10y')!==null).length;
  const allocCount=opts.filter(o=>o.actual||o.strategic).length;
  return{products:[...new Set(opts.map(o=>o.product))],costMin:costs.length?Math.min(...costs):null,costMax:costs.length?Math.max(...costs):null,perfCount,allocCount};
}
function fundPage(name){
  const opts=fundOptions(name);if(!opts.length)return fundsPage();
  const s=fundStats(opts),groups=new Map();
  for(const o of opts){const g=groupLabel(o);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(o)}
  const description=FUND_PROFILES[name]||`Explore the investment options and verified public data currently loaded for ${name}.`;
  return`<div class="page fund-profile"><div class="breadcrumb"><button data-view="funds">Funds</button> / ${esc(name)}</div><section class="fund-hero"><div class="fund-identity"><div class="fund-identity-mark">${esc(initials(name))}</div><div><span class="eyebrow">Super fund</span><h1>${esc(name)}</h1><p class="lead">${esc(description)}</p></div></div><div class="fund-facts"><div><span>Investment options</span><strong>${opts.length}</strong></div><div><span>Products loaded</span><strong>${s.products.length}</strong></div><div><span>10-year data</span><strong>${s.perfCount}/${opts.length}</strong></div><div><span>Portfolio data</span><strong>${s.allocCount}/${opts.length}</strong></div></div></section><section class="fund-overview"><div><span class="eyebrow">Overview</span><h2>What you can explore here</h2><p>${esc(name)} currently has ${opts.length} investment options loaded in Super Evidence. Use this page to understand the range first, then open an option for the detailed evidence.</p></div><div class="overview-notes"><div><strong>Investment cost range</strong><span>${s.costMin!==null?`${pct(s.costMin)}–${pct(s.costMax)}`:'Not yet available'}</span></div><div><strong>Products</strong><span>${esc(s.products.join(' · '))}</span></div><div><strong>Compare elsewhere</strong><button class="section-link" data-compare-fund="${esc(name)}">Compare with another fund →</button></div></div></section><section class="option-directory"><div class="section-head"><div><span class="eyebrow">Investment menu</span><h2>Investment options</h2></div><p>Start with the option type, then compare growth exposure, long-term return and current investment cost.</p></div>${[...groups.entries()].map(([label,rows])=>`<div class="option-group"><h3>${esc(label)}</h3><div class="option-list">${rows.map(o=>`<div class="option-list-row"><button class="option-main" data-open-option="${o.id}"><span><strong>${esc(o.option)}</strong><small>${esc(o.style)}</small></span></button><div class="option-stat"><span>Growth</span><strong>${pct(growth(o),1)}</strong></div><div class="option-stat"><span>10-year</span><strong>${perf(o,'10y')!==null?`${pct(perf(o,'10y'))} p.a.`:'—'}</strong></div><div class="option-stat"><span>Investment cost</span><strong>${pct(o.costs?.investmentAndTransactionPct?.value)}</strong></div><div class="option-stat"><span>Risk</span><strong>${esc(o.risk)}</strong></div><button class="option-compare" data-compare-from="${o.id}">Compare</button><button class="option-view" data-open-option="${o.id}">View →</button></div>`).join('')}</div></div>`).join('')}</section><section class="fund-guide"><div><span class="eyebrow">Plain English</span><h2>How to read the options</h2></div><p><strong>Growth exposure</strong> helps you understand how much market risk an option is taking. <strong>Long-term return</strong> tells you what happened historically, not what will happen next. <strong>Investment cost</strong> is one part of total fees and should be compared at the same balance.</p></section></div>`;
}

function canonicalAsset(label=''){
  const x=label.toLowerCase();
  if(x.includes('australian')&&x.includes('share'))return'Australian shares';
  if((x.includes('international')||x.includes('global'))&&x.includes('share'))return'International shares';
  if(x.includes('private equity'))return'Private equity';
  if(x.includes('infrastructure'))return'Infrastructure';
  if(x.includes('property'))return'Property';
  if(x.includes('credit'))return'Credit';
  if(x.includes('fixed')||x.includes('bond'))return'Fixed income';
  if(x.includes('cash'))return'Cash';
  if(x.includes('alternative')||x.includes('unlisted'))return'Unlisted & alternatives';
  return'Other';
}
function allocationMap(o){
  const alloc=o.actual||o.strategic;if(!alloc?.allocation)return new Map();
  const m=new Map();for(const [label,val] of alloc.allocation){const k=canonicalAsset(label),v=n(val)||0;m.set(k,(m.get(k)||0)+v)}return m;
}
function rawAllocation(o){const a=o.actual||o.strategic;return a?.allocation||[]}
function compareOptionsForFund(fund,selected){return fundOptions(fund).map(o=>`<option value="${o.id}" ${o.id===selected?'selected':''}>${esc(o.option)}</option>`).join('')}
function compare(){
  const names=fundNames();if(!names.length)return'';
  let a=option(state.compareA),b=option(state.compareB);
  if(!a)a=fundOptions(names[0])[0];
  if(!b){const f2=names.find(x=>x!==a.fund)||a.fund;b=fundOptions(f2)[0]||a}
  const fa=fee(a,balance()),fb=fee(b,balance());
  const ma=allocationMap(a),mb=allocationMap(b),order=['Australian shares','International shares','Property','Infrastructure','Private equity','Credit','Fixed income','Cash','Unlisted & alternatives','Other'];
  const cats=order.filter(k=>(ma.get(k)||0)>0||(mb.get(k)||0)>0);
  return`<div class="page"><div class="page-head"><span class="eyebrow">Compare portfolios</span><h1>See how two options are actually different.</h1><p class="lead">Choose a fund first, then an investment option. We’ll show the essentials before the detail.</p></div><div class="compare-builder"><div class="compare-side"><label>Fund A</label><select id="compareFundA">${names.map(f=>`<option value="${esc(f)}" ${f===a.fund?'selected':''}>${esc(f)}</option>`).join('')}</select><label>Investment option</label><select id="compareA">${compareOptionsForFund(a.fund,a.id)}</select></div><div class="compare-vs">vs</div><div class="compare-side"><label>Fund B</label><select id="compareFundB">${names.map(f=>`<option value="${esc(f)}" ${f===b.fund?'selected':''}>${esc(f)}</option>`).join('')}</select><label>Investment option</label><select id="compareB">${compareOptionsForFund(b.fund,b.id)}</select></div></div><section class="compare-summary"><div class="compare-summary-head"><div></div><div><strong>${esc(a.fund)}</strong><span>${esc(a.option)}</span></div><div><strong>${esc(b.fund)}</strong><span>${esc(b.option)}</span></div></div>${[['10-year return',perf(a,'10y')!==null?`${pct(perf(a,'10y'))} p.a.`:'Not yet verified',perf(b,'10y')!==null?`${pct(perf(b,'10y'))} p.a.`:'Not yet verified'],['Growth exposure',pct(growth(a),1),pct(growth(b),1)],['Risk',a.risk,b.risk],['Suggested timeframe',a.suggestedTimeframe,b.suggestedTimeframe],[`Estimated annual cost at ${money(balance())}`,money(fa.total),money(fb.total)]].map(r=>`<div class="compare-summary-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong><strong>${esc(r[2])}</strong></div>`).join('')}</section><section class="portfolio-section"><div class="section-head"><div><span class="eyebrow">Portfolio allocation</span><h2>What the portfolios invest in</h2></div><p>A simplified grouping for easier comparison. Original fund labels remain available below.</p></div>${cats.length?`<div class="allocation-compare"><div class="allocation-head"><span>Asset class</span><strong>${esc(a.option)}</strong><strong>${esc(b.option)}</strong></div>${cats.map(cat=>{const va=ma.get(cat)||0,vb=mb.get(cat)||0;return`<div class="allocation-row"><span>${esc(cat)}</span><div class="allocation-cell"><div class="alloc-track"><span class="alloc-fill a" style="width:${Math.min(100,va)}%"></span></div><strong>${pct(va,1)}</strong></div><div class="allocation-cell"><div class="alloc-track"><span class="alloc-fill b" style="width:${Math.min(100,vb)}%"></span></div><strong>${pct(vb,1)}</strong></div></div>`}).join('')}</div>`:`<div class="callout">Portfolio allocation is not yet loaded for both options.</div>`}<div class="allocation-note">This comparison groups issuer labels into broad categories for readability. It does not change the underlying source data.</div></section><div class="accordion"><details><summary>Original allocation labels</summary><div class="detail-body"><div class="raw-allocation-grid"><div><h3>${esc(a.fund)} — ${esc(a.option)}</h3>${rawAllocation(a).length?rawAllocation(a).map(([k,v])=>`<div class="data-row"><span>${esc(k)}</span><strong>${pct(v,2)}</strong></div>`).join(''):'<p class="muted">Not yet loaded.</p>'}</div><div><h3>${esc(b.fund)} — ${esc(b.option)}</h3>${rawAllocation(b).length?rawAllocation(b).map(([k,v])=>`<div class="data-row"><span>${esc(k)}</span><strong>${pct(v,2)}</strong></div>`).join(''):'<p class="muted">Not yet loaded.</p>'}</div></div></div></details><details><summary>Performance detail</summary><div class="detail-body">${['1y','3y','5y','7y','10y'].map(k=>`<div class="data-row"><span>${k.replace('y','-year')} return</span><strong>${pct(perf(a,k))} vs ${pct(perf(b,k))}</strong></div>`).join('')}</div></details></div></div>`;
}

function optionPage(id){
  const o=option(id)||options()[0];if(!o)return'';const f=fee(o,balance()),alloc=o.actual||o.strategic;
  return`<div class="page"><div class="breadcrumb"><button data-view="funds">Funds</button> / <button data-open-fund="${esc(o.fund)}">${esc(o.fund)}</button> / ${esc(o.option)}</div><section class="option-header"><div class="option-header-row"><div><span class="eyebrow">Investment option</span><h1>${esc(o.option)}</h1><p class="option-summary">${esc(o.fund)} · ${esc(o.style)}. ${growth(o)!==null?`${pct(growth(o),1)} growth exposure.`:'Growth exposure is not yet sufficiently verified.'}</p></div><button class="secondary-btn" data-compare-from="${o.id}">Compare this option</button></div><div class="metric-strip"><div class="metric"><label>10-year return</label><strong>${pct(perf(o,'10y'))}</strong><small>p.a. where verified</small></div><div class="metric"><label>Estimated annual cost</label><strong>${money(f.total)}</strong><small>at ${money(balance())}</small></div><div class="metric"><label>Growth exposure</label><strong>${pct(growth(o),1)}</strong><small>${defensive(o)!==null?`${pct(defensive(o),1)} defensive`:''}</small></div><div class="metric"><label>Risk</label><strong>${esc(o.risk)}</strong><small>Fund disclosure where loaded</small></div><div class="metric"><label>Timeframe</label><strong>${esc(o.suggestedTimeframe)}</strong><small>Fund guidance</small></div></div></section><div class="accordion"><details open><summary>Performance</summary><div class="detail-body">${['1y','3y','5y','7y','10y'].map(k=>`<div class="data-row"><span>${k.replace('y','-year')} return</span><strong>${pct(perf(o,k))}</strong></div>`).join('')}<div class="callout">Past performance is descriptive, not predictive. Longer periods are only useful when the investment strategy remained sufficiently comparable.</div></div></details><details><summary>What it invests in</summary><div class="detail-body">${alloc?.allocation?.length?alloc.allocation.map(([name,v])=>`<div class="data-row"><span>${esc(name)}</span><strong>${pct(v,2)}</strong></div>`).join(''):'<p class="muted">No sufficiently verified allocation snapshot is loaded yet.</p>'}</div></details><details><summary>Fees</summary><div class="detail-body"><div class="data-row"><span>Account keeping</span><strong>${money(f.fixed)}</strong></div><div class="data-row"><span>Asset-based administration</span><strong>${money(f.ap)}</strong></div><div class="data-row"><span>Investment + transaction</span><strong>${money(f.invest)}</strong></div><div class="data-row"><span>Costs met from reserves</span><strong>${money(f.reserve)}</strong></div><div class="data-row"><span>Total estimated disclosed cost</span><strong>${money(f.total)}</strong></div></div></details></div></div>`;
}

function calculatorsPage(){
  const b=Number(localStorage.getItem('calc_balance')||100000),annual=Number(localStorage.getItem('calc_contrib')||12000),r=Number(localStorage.getItem('calc_return')||6.5),fees=Number(localStorage.getItem('calc_fees')||0.7),infl=Number(localStorage.getItem('calc_infl')||2.5),years=Number(localStorage.getItem('calc_years')||20);
  let nominal=b;for(let y=0;y<years;y++)nominal=nominal*(1+(r-fees)/100)+annual;const real=nominal/Math.pow(1+infl/100,years);
  return`<div class="page"><div class="page-head"><span class="eyebrow">Calculators</span><h1>Useful calculations, with the assumptions out in the open.</h1><p class="lead">These are scenario tools, not forecasts. Every assumption is visible and editable.</p></div><div class="calculator-shell"><div><h2>Super projection</h2><p class="muted">A simple accumulation illustration using a constant annual return, constant fees and end-of-year contributions.</p><div class="assumptions">${[['Starting balance','calc_balance',b,1000],['Annual contributions','calc_contrib',annual,500],['Investment return %','calc_return',r,.1],['Fees %','calc_fees',fees,.1],['Inflation %','calc_infl',infl,.1],['Years','calc_years',years,1]].map(([label,id,val,step])=>`<label class="assumption-row"><span>${label}</span><input id="${id}" type="number" value="${val}" step="${step}"></label>`).join('')}</div></div><aside class="result-panel"><span class="eyebrow">Illustrative result</span><h3>Future balance</h3><div class="big-number">${money(nominal)}</div><p>In today’s dollars at the inflation assumption: <strong>${money(real)}</strong>.</p><div class="callout"><strong>Assumptions used</strong><br>Return ${pct(r,1)} · fees ${pct(fees,1)} · net investment rate ${pct(r-fees,1)} · inflation ${pct(infl,1)} · ${money(annual)} annual contributions · ${years} years.</div><p class="muted">This deliberately excludes tax complexity, contribution-limit rules, insurance, changing wages, investment volatility and sequencing. Later calculators will model these explicitly rather than hiding them.</p></aside></div></div>`;
}
function learnPage(){const topics={intro:['Start here','A super fund is the provider. An investment option is the portfolio inside it. Start with the fund, then compare what each option actually invests in.'],growth:['Growth and risk','More growth exposure generally means greater short-term volatility and greater expected long-run return. It is not a promise of a better outcome.'],returns:['Returns','Long-term returns are useful context, but only when the strategy over that history remained sufficiently comparable. Past performance is not a forecast.'],fees:['Fees','Compare fees at the same balance. A percentage that looks small can compound into a meaningful dollar difference over decades.'],allocations:['Portfolio allocations','Portfolio allocation shows where the money is invested. Similar option names can hide very different mixes of shares, property, infrastructure, credit, bonds and cash.']};const[t,x]=topics[state.topic]||topics.intro;return`<div class="page"><div class="page-head"><span class="eyebrow">Learn</span><h1>Super, without the jargon wall.</h1><p class="lead">Use these explanations while you browse the market.</p></div><div class="learn-layout"><nav class="learn-nav">${Object.entries(topics).map(([k,v])=>`<button data-topic="${k}" class="${state.topic===k?'active':''}">${v[0]}</button>`).join('')}</nav><article class="learn-article"><h2>${esc(t)}</h2><p>${esc(x)}</p></article></div></div>`}
function aboutPage(){return`<div class="page narrow"><div class="page-head"><span class="eyebrow">About</span><h1>Independent super research, built around evidence.</h1><p class="lead">Super Evidence is being designed as a public Australian superannuation resource: market-wide coverage, plain-English explanations and source-backed data.</p></div><div class="accordion"><details open><summary>What makes it different?</summary><div class="detail-body"><p>We compare investment options rather than relying on fund marketing labels. Source dates, verification status and methodology remain attached to the numbers.</p></div></details><details><summary>How does it make money?</summary><div class="detail-body"><p>The product principle is no pay-to-rank. Commercial models can be developed later without selling rankings or quietly favouring a provider.</p></div></details><details><summary>Is this financial advice?</summary><div class="detail-body"><p>No. The current product is designed around factual information, user-controlled comparisons and transparent calculations.</p></div></details></div></div>`}

function render(){
  setActive();const app=$('#app');
  const views={home,funds:fundsPage,fund:()=>fundPage(state.fund),compare,calculators:calculatorsPage,learn:learnPage,about:aboutPage};
  app.innerHTML=state.view==='option'?optionPage(state.option):(views[state.view]||home)();bind();
}
function openCompareFrom(id){
  const a=option(id);if(!a)return;const otherFund=fundNames().find(f=>f!==a.fund);const b=otherFund?fundOptions(otherFund)[0]:fundOptions(a.fund).find(o=>o.id!==a.id)||a;
  go('compare',{compareA:a.id,compareB:b?.id||a.id});
}
function bind(){
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
  document.querySelectorAll('[data-open-fund]').forEach(b=>b.onclick=()=>go('fund',{fund:b.dataset.openFund}));
  document.querySelectorAll('[data-open-option]').forEach(b=>b.onclick=()=>go('option',{option:b.dataset.openOption}));
  document.querySelectorAll('[data-compare-from]').forEach(b=>b.onclick=()=>openCompareFrom(b.dataset.compareFrom));
  document.querySelectorAll('[data-compare-fund]').forEach(b=>b.onclick=()=>{const a=fundOptions(b.dataset.compareFund)[0];if(a)openCompareFrom(a.id)});
  const hs=$('#homeSearch'),hr=$('#homeResults');if(hs){hs.oninput=()=>{hr.innerHTML=fundSearchResults(hs.value);hr.hidden=!hs.value.trim();hr.querySelectorAll('[data-open-fund]').forEach(b=>b.onclick=()=>go('fund',{fund:b.dataset.openFund}))};const hb=$('#homeSearchButton');if(hb)hb.onclick=()=>{const exact=fundNames().find(f=>f.toLowerCase()===hs.value.trim().toLowerCase());if(exact)go('fund',{fund:exact})}};
  const fA=$('#compareFundA'),fB=$('#compareFundB'),a=$('#compareA'),b=$('#compareB');
  if(fA)fA.onchange=()=>{const next=fundOptions(fA.value)[0];state.compareA=next?.id||null;render()};
  if(fB)fB.onchange=()=>{const next=fundOptions(fB.value)[0];state.compareB=next?.id||null;render()};
  if(a)a.onchange=()=>{state.compareA=a.value;render()};if(b)b.onchange=()=>{state.compareB=b.value;render()};
  document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{state.topic=b.dataset.topic;render()});
  for(const id of ['calc_balance','calc_contrib','calc_return','calc_fees','calc_infl','calc_years']){const el=$('#'+id);if(el)el.onchange=()=>{localStorage.setItem(id,String(el.value));render()}}
}
function bindGlobalSearch(){
  const dlg=$('#searchDialog'),open=$('#globalSearchButton'),close=$('#closeSearch'),input=$('#dialogSearchInput'),results=$('#dialogSearchResults');
  open.onclick=()=>{dlg.showModal();input.value='';results.innerHTML='<div class="empty">Search for a super fund.</div>';setTimeout(()=>input.focus(),20)};close.onclick=()=>dlg.close();
  input.oninput=()=>{results.innerHTML=fundSearchResults(input.value);results.querySelectorAll('[data-open-fund]').forEach(b=>b.onclick=()=>{dlg.close();go('fund',{fund:b.dataset.openFund})})};
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
}
async function init(){
  $('#app').innerHTML='<div class="page"><div class="page-head"><span class="eyebrow">Loading</span><h1>Loading Australia’s super data…</h1></div></div>';
  await loadData();bindGlobalSearch();render();
}
init().catch(err=>{$('#app').innerHTML=`<div class="page"><div class="callout"><strong>Unable to load Super Evidence</strong><p>${esc(err.message)}</p></div></div>`;console.error(err)});
