const DATA_URL = './data/options.json';
const tabs = ['Overview','Composition','Performance','Fees','History','Evidence'];
const palette = ['#184d3b','#527d69','#8da897','#bcc9bf','#d8ded8','#415c75','#8098ab','#b8c8d5','#d8e1e8','#9a8662'];
let db, currentTab='Overview', historyYear='2026', compositionMode='strategic';

const fmtPct = v => `${Number(v).toFixed(2).replace(/\.00$/,'')}%`;
const fmtMoney = v => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(v);
const byId = id => document.getElementById(id);

function statusLabel(status){
  if(status==='issuer_verified') return ['verified','Issuer verified'];
  if(status==='regulator_verified') return ['regulator','APRA verified'];
  if(status==='secondary_crosscheck') return ['pending','Secondary cross-check'];
  return ['neutral','Unverified'];
}
function badge(status){ const [cls,label]=statusLabel(status); return `<span class="badge ${cls}">${label}</span>`; }
function sourceIcon(payload){
  return `<button class="metric-source" data-evidence='${JSON.stringify(payload).replace(/'/g,"&#39;")}' aria-label="View evidence">i</button>`;
}
function optionHeaders(){
  byId('optionHeaders').innerHTML = `<div class="option-spacer">Investment option</div>` + db.options.map(o=>`
    <div class="option-head">
      <div class="fund">${o.fund} · ${o.product}</div>
      <div class="option-name">${o.option}</div>
      <div class="meta"><span class="badge neutral">${o.style}</span><span class="badge neutral">${o.growth}% growth</span></div>
    </div>`).join('');
}
function renderTabs(){
  byId('tabs').innerHTML=tabs.map(t=>`<button class="tab-button ${t===currentTab?'active':''}" data-tab="${t}">${t}</button>`).join('');
  document.querySelectorAll('.tab-button').forEach(b=>b.onclick=()=>{currentTab=b.dataset.tab;renderTabs();renderContent();});
}
function metricCell(o,key,label){
  const m=o.performance[key];
  const note=m.status==='secondary_crosscheck'?'Exact value currently cross-checked externally; issuer performance page linked in evidence.':'';
  return `<td><div class="metric-value">${fmtPct(m.value)} ${sourceIcon({optionId:o.id,type:'performance',key,label})}</div>${note?`<div class="metric-note">${note}</div>`:''}</td>`;
}
function genericCell(o,value,label,source,status='issuer_verified',note=''){
  return `<td><div class="metric-value">${value} ${sourceIcon({optionId:o.id,type:'generic',label,source,status,value})}</div>${note?`<div class="metric-note">${note}</div>`:''}</td>`;
}
function overview(){
  const [a,b]=db.options;
  return `
    <table class="metric-table">
      <tr><th>10-year return</th>${metricCell(a,'10y','10-year return')}${metricCell(b,'10y','10-year return')}</tr>
      <tr><th>5-year return</th>${metricCell(a,'5y','5-year return')}${metricCell(b,'5y','5-year return')}</tr>
      <tr><th>3-year return</th>${metricCell(a,'3y','3-year return')}${metricCell(b,'3y','3-year return')}</tr>
      <tr><th>Growth assets</th>${genericCell(a,fmtPct(a.growth),'Issuer-reported growth assets','art-current')}${genericCell(b,fmtPct(b.growth),'Issuer-reported growth assets','aware-current')}</tr>
      <tr><th>Defensive assets</th>${genericCell(a,fmtPct(a.defensive),'Issuer-reported defensive assets','art-current')}${genericCell(b,fmtPct(b.defensive),'Issuer-reported defensive assets','aware-current')}</tr>
      <tr><th>Investment + transaction cost</th>${genericCell(a,fmtPct(a.costs.investmentAndTransactionPct.value),'Investment & transaction cost',a.costs.investmentAndTransactionPct.source)}${genericCell(b,fmtPct(b.costs.investmentAndTransactionPct.value),'Investment & transaction cost',b.costs.investmentAndTransactionPct.source)}</tr>
      <tr><th>Suggested timeframe</th>${genericCell(a,a.suggestedTimeframe,'Suggested investment timeframe','art-current')}${genericCell(b,b.suggestedTimeframe,'Suggested investment timeframe','aware-current')}</tr>
    </table>
    <div class="insight-strip"><strong>What stands out</strong><p>ART has the stronger verified 10-year result in this comparison while reporting a slightly lower overall growth allocation and lower disclosed option-level investment cost. Aware has more granular public asset-class disclosure and a larger strategic allocation to international shares. This is descriptive comparison, not a recommendation.</p></div>`;
}
function allocationFor(o){
  if(compositionMode==='actual' && o.actual) return {allocation:o.actual.allocation, source:o.actual.source, label:`Actual · ${o.actual.reportingDate}`};
  const snap=o.strategic[historyYear] || Object.values(o.strategic).at(-1);
  return {allocation:snap.allocation,source:snap.source,label:`Strategic · effective ${snap.effective}`};
}
function stackCard(o){
  const s=allocationFor(o);
  return `<article class="alloc-card"><h4>${o.shortFund} ${o.option}</h4><div class="sub">${s.label}</div>
  <div class="stack">${s.allocation.map((x,i)=>`<div class="stack-seg" title="${x[0]} ${x[1]}%" style="width:${x[1]}%;background:${palette[i%palette.length]}"></div>`).join('')}</div>
  <div class="legend">${s.allocation.filter(x=>x[1]>0).map((x,i)=>`<div class="legend-row"><span class="dot" style="background:${palette[i%palette.length]}"></span><span>${x[0]}</span><strong>${x[1]}%</strong></div>`).join('')}</div>
  <div class="metric-note">${sourceIcon({optionId:o.id,type:'allocation',label:s.label,source:s.source,value:'Asset allocation'})} View source and reporting context</div></article>`;
}
function composition(){
  return `<div class="section-pad">
    <div class="section-title"><div><div class="section-kicker">PORTFOLIO DNA</div><h3>What the options actually hold</h3></div><div><button class="year-button ${compositionMode==='strategic'?'active':''}" data-mode="strategic">Strategic</button> <button class="year-button ${compositionMode==='actual'?'active':''}" data-mode="actual">Actual</button></div></div>
    ${compositionMode==='actual' && !db.options[0].actual?'<div class="insight-strip"><strong>Evidence gap</strong><p>ART’s current option page publishes the strategic mix, but this prototype has not yet loaded a like-for-like actual allocation snapshot for ART. Aware publishes actual allocations quarterly. We show “not loaded” rather than substituting strategic data as actual.</p></div>':''}
    <div class="alloc-grid">${db.options.map(o=> compositionMode==='actual'&&!o.actual ? `<article class="alloc-card"><h4>${o.shortFund} ${o.option}</h4><div class="sub">Actual allocation</div><p class="metric-note">Not yet loaded from a primary issuer source in this prototype.</p></article>` : stackCard(o)).join('')}</div>
    <div class="card-grid" style="margin-top:20px">${db.options.map(o=>`<article class="simple-card"><div class="section-kicker">GROWTH / DEFENSIVE</div><div class="big">${o.growth}% / ${o.defensive}%</div><p>Issuer-reported classification. This is intentionally kept separate from any future APRA-standardised calculation.</p></article>`).join('')}</div>
  </div>`;
}
function performance(){
  const periods=[['1y','1 year'],['3y','3 years'],['5y','5 years'],['10y','10 years']];
  return `<div class="section-pad"><div class="section-title"><div><div class="section-kicker">LONG-TERM RETURNS</div><h3>Performance with evidence status</h3></div><p>Annualised for periods over one year. This prototype keeps issuer-verified figures visually distinct from secondary cross-checks.</p></div>
    <div class="bar-list">${periods.map(([k,l])=>{ const max=Math.max(...db.options.map(o=>o.performance[k].value)); return `<div><strong style="font-size:13px">${l}</strong>${db.options.map(o=>`<div class="bar-row"><span>${o.shortFund}</span><div class="bar-track"><div class="bar-fill" style="width:${o.performance[k].value/max*100}%"></div></div><div class="bar-val">${fmtPct(o.performance[k].value)}</div></div>`).join('')}</div>`;}).join('')}</div>
    <div class="insight-strip"><strong>Important</strong><p>Aware's 3- and 5-year values are retained here as secondary cross-checks while deterministic extraction from Aware's dynamically rendered issuer table is still pending. They are not marked issuer verified. ART's displayed period values are directly extracted from ART's public option page.</p></div>
  </div>`;
}
function calculateFees(o,balance){
  const c=o.costs;
  let adminPct;
  if(c.adminPercent.capBalance) adminPct=Math.min(balance,c.adminPercent.capBalance)*(c.adminPercent.value/100);
  else adminPct=Math.min(balance*(c.adminPercent.value/100),c.adminPercent.annualCap ?? Infinity);
  const adminFixed=c.adminFixedAnnual.value;
  const reserve=balance*(c.reservePercent.value/100);
  const invest=balance*(c.investmentAndTransactionPct.value/100);
  return {adminFixed,adminPct,reserve,invest,total:adminFixed+adminPct+reserve+invest,accountDeducted:adminFixed+adminPct};
}
function fees(){
  return `<div class="section-pad"><div class="section-title"><div><div class="section-kicker">FEE ENGINE</div><h3>What the disclosed formulas imply</h3></div><p>Current accumulation-account formulas. Insurance, advice and member-specific activity fees are excluded.</p></div>
    <div class="fee-control"><label for="balanceRange"><strong>Super balance</strong></label><input id="balanceRange" type="range" min="10000" max="500000" step="5000" value="100000"><div id="balanceDisplay" class="balance-display">$100,000</div></div>
    <div id="feeCards" class="card-grid"></div>
  </div>`;
}
function updateFees(){
  const input=byId('balanceRange'); if(!input) return;
  const balance=Number(input.value); byId('balanceDisplay').textContent=fmtMoney(balance);
  byId('feeCards').innerHTML=db.options.map(o=>{const f=calculateFees(o,balance); return `<article class="simple-card"><div class="section-kicker">${o.shortFund.toUpperCase()} · ESTIMATED DISCLOSED COST</div><div class="big">${fmtMoney(f.total)}</div><p>Approx. ${fmtPct(f.total/balance*100)} of the selected balance based on current disclosed formulas.</p><div class="fee-breakdown">Account keeping: ${fmtMoney(f.adminFixed)}<br>Asset-based admin: ${fmtMoney(f.adminPct)}<br>Investment + transaction: ${fmtMoney(f.invest)}<br>Costs met from reserves: ${fmtMoney(f.reserve)}</div>${sourceIcon({optionId:o.id,type:'fees',label:'Fee formula',source:o.costs.adminFixedAnnual.source,value:fmtMoney(f.total)})}</article>`;}).join('');
}
function history(){
  return `<div class="section-pad"><div class="section-title"><div><div class="section-kicker">TIME MACHINE</div><h3>See the strategy, not just the return</h3></div><p>Choose a year to view the strategic allocation that was in effect in our loaded history.</p></div>
    <div class="history-controls"><button class="year-button ${historyYear==='2025'?'active':''}" data-year="2025">2025</button><button class="year-button ${historyYear==='2026'?'active':''}" data-year="2026">2026</button></div>
    <div class="alloc-grid">${db.options.map(stackCard).join('')}</div>
    <div class="section-title" style="margin-top:34px"><div><div class="section-kicker">CHANGE LOG</div><h3>Material events we preserve</h3></div></div>
    <div class="alloc-grid">${db.options.map(o=>`<div><h4>${o.fund}</h4><div class="timeline">${o.history.map(e=>`<div class="timeline-event"><div class="date">${e.date} · ${e.severity}</div><h4>${e.title}</h4><p>${e.text} ${sourceIcon({optionId:o.id,type:'generic',label:e.title,source:e.source,status:'issuer_verified',value:e.date})}</p></div>`).join('')}</div></div>`).join('')}</div>
  </div>`;
}
function evidence(){
  const sources=Object.entries(db.sources);
  return `<div class="section-pad"><div class="section-title"><div><div class="section-kicker">SOURCE REGISTRY</div><h3>Public evidence used by this prototype</h3></div><p>Primary issuer sources are preferred. APRA is the regulatory methodology layer. Secondary sources are cross-checks only.</p></div><div class="evidence-list">${sources.map(([id,s])=>`<div class="evidence-row"><div><h4>${s.organisation} — ${s.title}</h4><p>${s.notes || ''}</p></div><div>${badge(s.type==='issuer_primary'||s.type==='issuer_archive'?'issuer_verified':s.type==='regulator'?'regulator_verified':'secondary_crosscheck')}<br><a class="source-link" href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></div></div>`).join('')}</div></div>`;
}
function renderContent(){
  const f={Overview:overview,Composition:composition,Performance:performance,Fees:fees,History:history,Evidence:evidence}[currentTab];
  byId('tabContent').innerHTML=f();
  bindEvidence();
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{compositionMode=b.dataset.mode;renderContent();});
  document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{historyYear=b.dataset.year;renderContent();});
  if(currentTab==='Fees'){ byId('balanceRange').oninput=updateFees; updateFees(); }
}
function evidencePayload(el){ try{return JSON.parse(el.dataset.evidence.replace(/&quot;/g,'"'));}catch{return null;} }
function bindEvidence(){ document.querySelectorAll('[data-evidence]').forEach(el=>el.onclick=(ev)=>{ev.stopPropagation();openEvidence(evidencePayload(el));}); }
function resolveEvidence(p){
  const o=db.options.find(x=>x.id===p.optionId); let srcId=p.source, status=p.status, value=p.value, note='';
  if(p.type==='performance'){ const m=o.performance[p.key]; srcId=m.source;status=m.status;value=fmtPct(m.value); if(m.issuerLink) note=`Issuer performance page: ${db.sources[m.issuerLink].url}`; }
  if(p.type==='allocation'){ srcId=p.source;status='issuer_verified'; }
  const src=db.sources[srcId]; return {o,src,status:status||'issuer_verified',value,note,label:p.label};
}
function openEvidence(p){
  if(!p) return; const e=resolveEvidence(p); const [cls,label]=statusLabel(e.status);
  byId('drawerTitle').textContent=e.label || 'Evidence';
  byId('drawerBody').innerHTML=`
    <div class="evidence-block"><div class="evidence-label">Displayed value</div><div class="evidence-main">${e.value ?? 'See source'}</div><div style="margin-top:8px"><span class="badge ${cls}">${label}</span></div></div>
    <div class="evidence-block"><div class="evidence-label">Investment</div><div class="evidence-text"><strong>${e.o.fund} — ${e.o.option}</strong><br>${e.o.product}</div></div>
    <div class="evidence-block"><div class="evidence-label">Source</div><div class="evidence-text"><strong>${e.src.organisation}</strong><br>${e.src.title}<br>${e.src.reportingDate?`Reporting date: ${e.src.reportingDate}<br>`:''}${e.src.effectiveDate?`Effective date: ${e.src.effectiveDate}<br>`:''}${e.src.notes||''}</div><a class="source-link" href="${e.src.url}" target="_blank" rel="noopener">View original source ↗</a></div>
    ${e.status==='secondary_crosscheck'?`<div class="evidence-block"><div class="evidence-label">Verification warning</div><div class="evidence-text">This value is retained as a secondary cross-check and is <strong>not yet labelled issuer verified</strong>. The relevant issuer performance page is linked separately in the source registry. Production publication rules would require deterministic issuer extraction or manual evidence review before upgrading its status.</div></div>`:''}
    <div class="evidence-block"><div class="evidence-label">Design principle</div><div class="evidence-text">The production Evidence Ledger will also retain raw value, normalised value, extraction method, content hash, parser version, prior observation and APRA cross-check where available.</div></div>`;
  byId('drawerBackdrop').hidden=false; byId('evidenceDrawer').classList.add('open'); byId('evidenceDrawer').setAttribute('aria-hidden','false');
}
function closeEvidence(){ byId('drawerBackdrop').hidden=true;byId('evidenceDrawer').classList.remove('open');byId('evidenceDrawer').setAttribute('aria-hidden','true'); }
async function init(){
  const res=await fetch(DATA_URL); db=await res.json(); optionHeaders(); renderTabs(); renderContent();
  byId('closeDrawer').onclick=closeEvidence;byId('drawerBackdrop').onclick=closeEvidence;
  byId('methodologyButton').onclick=()=>byId('methodologyModal').hidden=false;
  byId('closeMethodology').onclick=()=>byId('methodologyModal').hidden=true;
  byId('methodologyModal').onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.hidden=true;};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEvidence();byId('methodologyModal').hidden=true;}});
}
init().catch(err=>{byId('tabContent').innerHTML=`<div class="section-pad"><h3>Could not load prototype data.</h3><p>${err.message}</p><p>Open this site through a web server rather than directly as a local file.</p></div>`;console.error(err);});
