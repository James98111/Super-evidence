const DATA_URL = './data/options.json';
const tabDefs = [
  ['Summary','Summary'],
  ['What you own','What you own'],
  ['Returns','Returns'],
  ['Fees','Fees'],
  ["How it's changed","How it's changed"],
  ['Sources','Sources']
];
const palette = ['#175b49','#4f7f70','#8aaa9d','#b9c9c1','#d7ddd7','#315f7d','#738fa3','#a9bcc8','#d1dbe0','#9a8155'];
let db;
let currentTab = 'Summary';
let viewMode = 'simple';
let historyYear = '2026';
let compositionMode = 'strategic';

const $ = id => document.getElementById(id);
const fmtPct = v => `${Number(v).toFixed(2).replace(/\.00$/,'')}%`;
const fmtMoney = v => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(v);
const fmtPP = v => `${Number(v).toFixed(2)} percentage points`;

function sourceButton(payload){
  const json = JSON.stringify(payload).replace(/'/g,'&#39;');
  return `<button class="metric-source" data-evidence='${json}' aria-label="Show source for this number">i</button>`;
}

function statusText(status){
  if(status === 'issuer_verified') return ['Primary fund source',''];
  if(status === 'regulator_verified') return ['APRA source',''];
  if(status === 'secondary_crosscheck') return ['Secondary cross-check','pending'];
  return ['Not yet independently verified','pending'];
}

function optionHeaders(){
  $('optionHeaders').innerHTML = `<div class="option-spacer">Investment option</div>` + db.options.map(o => `
    <div class="option-head">
      <div class="fund">${o.fund} · ${o.product}</div>
      <div class="option-name">${o.option}</div>
      <div class="option-summary"><strong>${o.growth}% growth</strong> · ${o.risk} · ${o.suggestedTimeframe}</div>
    </div>`).join('');
}

function renderTabs(){
  $('tabs').innerHTML = tabDefs.map(([key,label]) => `<button class="tab-button ${key===currentTab?'active':''}" data-tab="${key}">${label}</button>`).join('');
  document.querySelectorAll('[data-tab]').forEach(btn => btn.onclick = () => {
    currentTab = btn.dataset.tab;
    renderTabs();
    renderContent();
  });
}

function calcFees(o,balance){
  const c = o.costs;
  const adminPct = c.adminPercent.capBalance
    ? Math.min(balance,c.adminPercent.capBalance) * (c.adminPercent.value/100)
    : Math.min(balance * (c.adminPercent.value/100), c.adminPercent.annualCap ?? Infinity);
  const adminFixed = c.adminFixedAnnual.value;
  const reserve = balance * (c.reservePercent.value/100);
  const invest = balance * (c.investmentAndTransactionPct.value/100);
  return {adminPct,adminFixed,reserve,invest,total:adminPct+adminFixed+reserve+invest};
}

function metricCell(o, key, explanation){
  const m = o.performance[key];
  const label = `${key.replace('y','-year')} return`;
  return `<td>
    <div class="metric-value">${fmtPct(m.value)} ${sourceButton({optionId:o.id,type:'performance',key,label})}</div>
    <div class="metric-explain">${explanation}</div>
    ${m.status==='secondary_crosscheck'?`<div class="what-it-means">This exact figure is currently a secondary cross-check; the fund's performance page is linked in the source panel.</div>`:''}
  </td>`;
}

function genericCell(o,value,label,source,explanation,status='issuer_verified'){
  return `<td>
    <div class="metric-value">${value} ${sourceButton({optionId:o.id,type:'generic',label,source,status,value})}</div>
    ${explanation?`<div class="metric-explain">${explanation}</div>`:''}
  </td>`;
}

function summary(){
  const [art,aware] = db.options;
  const returnDiff = art.performance['10y'].value - aware.performance['10y'].value;
  const growthDiff = aware.growth - art.growth;
  const artFees = calcFees(art,100000);
  const awareFees = calcFees(aware,100000);
  const cheaper = artFees.total < awareFees.total ? art : aware;
  const feeDiff = Math.abs(artFees.total-awareFees.total);

  return `<div class="section-pad ${viewMode==='detail'?'detail-view':''}">
    <div class="section-intro">
      <h3>The short version</h3>
      <p>There is no single “winner”. These are the main differences a member would want to understand first.</p>
    </div>

    <div class="answer-grid">
      <article class="answer-card">
        <div class="answer-question">Which has the stronger 10-year return?</div>
        <h4>ART, historically.</h4>
        <p>ART High Growth returned <strong>${fmtPct(art.performance['10y'].value)} p.a.</strong> versus Aware's <strong>${fmtPct(aware.performance['10y'].value)} p.a.</strong> to 30 June 2026 — a difference of <span class="difference">${fmtPP(returnDiff)} a year</span>. Past performance does not tell us which will do better next.</p>
      </article>
      <article class="answer-card">
        <div class="answer-question">Which takes more growth risk?</div>
        <h4>Aware, slightly.</h4>
        <p>Aware reports <strong>${aware.growth}% growth assets</strong> versus ART's <strong>${art.growth}%</strong>. That extra ${growthDiff} percentage points may mean a little more exposure to market ups and downs, but the underlying asset mix matters too.</p>
      </article>
      <article class="answer-card">
        <div class="answer-question">Which is cheaper around a $100,000 balance?</div>
        <h4>${cheaper.shortFund} in this estimate.</h4>
        <p>Using the current disclosed formulas loaded in this prototype, the difference is about <span class="difference">${fmtMoney(feeDiff)} a year</span> at $100,000. Use the Fees tab for your own balance.</p>
      </article>
      <article class="answer-card">
        <div class="answer-question">Are these basically the same investment?</div>
        <h4>No.</h4>
        <p>Both are called “High Growth”, but their share exposure, unlisted/private assets, cash, infrastructure and other holdings differ. The name alone is not enough to compare them.</p>
      </article>
    </div>

    <div class="plain-callout">
      <h4>What does “High Growth” actually mean?</h4>
      <p>It usually means most of your money is invested in assets designed to grow over the long term, such as shares, property and infrastructure. These options can fall substantially in bad markets, so both funds suggest a long investment timeframe.</p>
    </div>

    <table class="metric-table">
      <tr><th>10-year return</th>${metricCell(art,'10y','Average annual return over the 10 years to 30 June 2026.')}${metricCell(aware,'10y','Average annual return over the 10 years to 30 June 2026.')}</tr>
      <tr><th>Growth assets</th>${genericCell(art,fmtPct(art.growth),'Fund-reported growth assets','art-current','Higher growth generally means more long-term risk and return potential.')}${genericCell(aware,fmtPct(aware.growth),'Fund-reported growth assets','aware-current','Higher growth generally means more long-term risk and return potential.')}</tr>
      <tr><th>Suggested timeframe</th>${genericCell(art,art.suggestedTimeframe,'Suggested timeframe','art-current','How long the fund suggests you should be prepared to stay invested.')}${genericCell(aware,aware.suggestedTimeframe,'Suggested timeframe','aware-current','How long the fund suggests you should be prepared to stay invested.')}</tr>
      <tr class="detail-only"><th>5-year return</th>${metricCell(art,'5y','Annualised five-year return.')}${metricCell(aware,'5y','Annualised five-year return.')}</tr>
      <tr class="detail-only"><th>3-year return</th>${metricCell(art,'3y','Annualised three-year return.')}${metricCell(aware,'3y','Annualised three-year return.')}</tr>
      <tr class="detail-only"><th>Defensive assets</th>${genericCell(art,fmtPct(art.defensive),'Fund-reported defensive assets','art-current','Assets generally intended to reduce volatility, such as cash and fixed income.')}${genericCell(aware,fmtPct(aware.defensive),'Fund-reported defensive assets','aware-current','Assets generally intended to reduce volatility, such as cash and fixed income.')}</tr>
      <tr class="detail-only"><th>Investment + transaction cost</th>${genericCell(art,fmtPct(art.costs.investmentAndTransactionPct.value),'Investment and transaction cost',art.costs.investmentAndTransactionPct.source,'The disclosed option-level cost before member-specific fees.')}${genericCell(aware,fmtPct(aware.costs.investmentAndTransactionPct.value),'Investment and transaction cost',aware.costs.investmentAndTransactionPct.source,'The disclosed option-level cost before member-specific fees.')}</tr>
    </table>

    ${viewMode==='simple'?`<div class="glossary-box"><strong>Want the full research view?</strong><p>Switch to <strong>Full detail</strong> above to expose more return periods, defensive exposure and technical data. The evidence stays the same in both views.</p></div>`:''}
  </div>`;
}

function allocationFor(o){
  if(compositionMode==='actual' && o.actual){
    return {allocation:o.actual.allocation,source:o.actual.source,label:`Actual holdings mix · ${o.actual.reportingDate}`};
  }
  const snap = o.strategic[historyYear] || Object.values(o.strategic).at(-1);
  return {allocation:snap.allocation,source:snap.source,label:`Target mix · effective ${snap.effective}`};
}

function stackCard(o){
  const s = allocationFor(o);
  return `<article class="alloc-card">
    <h4>${o.shortFund} ${o.option}</h4>
    <div class="sub">${s.label}</div>
    <div class="stack" aria-label="Asset allocation bar">${s.allocation.map((x,i)=>`<div class="stack-seg" title="${x[0]} ${x[1]}%" style="width:${x[1]}%;background:${palette[i%palette.length]}"></div>`).join('')}</div>
    <div class="legend">${s.allocation.filter(x=>x[1]>0).map((x,i)=>`<div class="legend-row"><span class="dot" style="background:${palette[i%palette.length]}"></span><span>${x[0]}</span><strong>${x[1]}%</strong></div>`).join('')}</div>
    <div class="metric-explain" style="margin-top:10px">${sourceButton({optionId:o.id,type:'allocation',label:s.label,source:s.source,value:'Asset allocation'})} Open the public source for this allocation.</div>
  </article>`;
}

function composition(){
  const [art,aware]=db.options;
  return `<div class="section-pad ${viewMode==='detail'?'detail-view':''}">
    <div class="section-intro">
      <h3>What is your money actually invested in?</h3>
      <p>This is the part that explains why two options called “High Growth” can behave differently.</p>
    </div>
    <div class="plain-callout">
      <h4>Start with the big picture</h4>
      <p>ART reports ${art.growth}% in growth assets and Aware ${aware.growth}%. But the more useful question is <em>where</em> that growth exposure comes from — Australian shares, international shares, infrastructure, private equity, property and other assets.</p>
    </div>
    ${viewMode==='detail'?`<div class="mode-row"><button class="year-button ${compositionMode==='strategic'?'active':''}" data-mode="strategic">Target allocation</button><button class="year-button ${compositionMode==='actual'?'active':''}" data-mode="actual">Actual allocation</button></div>`:''}
    ${compositionMode==='actual' && !art.actual?`<div class="plain-callout warning"><h4>Why ART is blank in Actual view</h4><p>We have not yet loaded a like-for-like current actual allocation from a primary ART source. We would rather show a gap than quietly substitute its target allocation.</p></div>`:''}
    <div class="alloc-grid">
      ${db.options.map(o => compositionMode==='actual' && !o.actual ? `<article class="alloc-card"><h4>${o.shortFund} ${o.option}</h4><div class="sub">Actual allocation</div><p>Not yet loaded from a suitable primary public source.</p></article>` : stackCard(o)).join('')}
    </div>
    <div class="glossary-box"><strong>Target vs actual allocation</strong><p>A target (or strategic) allocation is what the fund aims to hold over time. Actual allocation is what it held on a particular reporting date. They will rarely be identical because markets move and portfolios are rebalanced.</p></div>
  </div>`;
}

function returns(){
  const periods=[['1y','1 year'],['3y','3 years'],['5y','5 years'],['10y','10 years']];
  return `<div class="section-pad ${viewMode==='detail'?'detail-view':''}">
    <div class="section-intro"><h3>How have the options performed?</h3><p>Longer periods usually tell you more than a single year, but performance should always be read alongside risk, fees and changes to the strategy.</p></div>
    <div class="plain-callout"><h4>How to read “10-year return”</h4><p>A 10-year return of 10.07% p.a. does <strong>not</strong> mean the option earned exactly 10.07% every year. It is the annualised result across the full period, including good and bad years.</p></div>
    <div class="bar-list">${periods.map(([key,label])=>{
      const max=Math.max(...db.options.map(o=>o.performance[key].value));
      return `<div><div class="bar-period">${label}</div>${db.options.map(o=>`<div class="bar-row"><span>${o.shortFund}</span><div class="bar-track"><div class="bar-fill" style="width:${o.performance[key].value/max*100}%"></div></div><div class="bar-val">${fmtPct(o.performance[key].value)}</div></div>`).join('')}</div>`;
    }).join('')}</div>
    <div class="return-explainer">
      <div><strong>1 year</strong><p>Useful for seeing what just happened, but too short to judge a long-term strategy on its own.</p></div>
      <div><strong>5 years</strong><p>Starts to smooth out individual market years, though one cycle can still dominate.</p></div>
      <div><strong>10 years</strong><p>Usually much more informative, provided the option did not materially change strategy during the period.</p></div>
    </div>
    ${db.options.some(o=>o.performance['3y'].status==='secondary_crosscheck')?`<div class="plain-callout warning" style="margin-top:22px"><h4>One evidence limitation in this prototype</h4><p>Aware's 3- and 5-year values are currently stored as secondary cross-checks while deterministic extraction from Aware's own dynamically rendered performance table is still pending. They are deliberately not labelled as primary-source verified.</p></div>`:''}
  </div>`;
}

function fees(){
  return `<div class="section-pad">
    <div class="section-intro"><h3>What might these options cost at your balance?</h3><p>Percentages are hard to interpret. Move the balance slider and we convert the current disclosed fee formulas into approximate dollars.</p></div>
    <div class="fee-control"><label for="balanceRange"><strong>Your super balance</strong><br><small>Move the slider</small></label><input id="balanceRange" type="range" min="10000" max="500000" step="5000" value="100000"><div id="balanceDisplay" class="balance-display">$100,000</div></div>
    <div id="feeCards" class="card-grid"></div>
    <div class="glossary-box"><strong>What is included?</strong><p>This prototype combines the administration, investment/transaction and reserve-related amounts represented in the loaded public fee formulas. Insurance, advice and member-specific activity fees are excluded. The source panel shows the underlying disclosures.</p></div>
  </div>`;
}

function updateFees(){
  const range=$('balanceRange');
  if(!range) return;
  const balance=Number(range.value);
  $('balanceDisplay').textContent=fmtMoney(balance);
  $('feeCards').innerHTML=db.options.map(o=>{
    const f=calcFees(o,balance);
    return `<article class="simple-card">
      <h4>${o.fund}</h4>
      <div class="sub">${o.option} · estimated disclosed annual cost</div>
      <div class="fee-total">${fmtMoney(f.total)}</div>
      <div class="fee-weekly">about ${fmtMoney(f.total/52)} a week</div>
      <p>Equivalent to roughly ${fmtPct(f.total/balance*100)} of this balance using the formulas currently loaded.</p>
      <div class="fee-breakdown">Administration — fixed: ${fmtMoney(f.adminFixed)}<br>Administration — balance based: ${fmtMoney(f.adminPct)}<br>Investment + transaction: ${fmtMoney(f.invest)}<br>Reserve-related cost: ${fmtMoney(f.reserve)}</div>
      <div style="margin-top:10px">${sourceButton({optionId:o.id,type:'fees',label:'Fee estimate',source:o.costs.adminFixedAnnual.source,value:fmtMoney(f.total)})} <span class="metric-explain">View fee source</span></div>
    </article>`;
  }).join('');
}

function history(){
  return `<div class="section-pad ${viewMode==='detail'?'detail-view':''}">
    <div class="section-intro"><h3>Has the investment changed over time?</h3><p>This matters because a 10-year return may have been earned by a portfolio that was not exactly the same as the one you can choose today.</p></div>
    <div class="plain-callout"><h4>Why we keep old versions</h4><p>If a fund changes its target mix, renames an option or inherits a predecessor's return history, we preserve that event. We do not want a historical return to look more comparable with today's portfolio than it really is.</p></div>
    <div class="history-controls"><button class="year-button ${historyYear==='2025'?'active':''}" data-year="2025">Show 2025 portfolio</button><button class="year-button ${historyYear==='2026'?'active':''}" data-year="2026">Show 2026 portfolio</button></div>
    <div class="alloc-grid">${db.options.map(stackCard).join('')}</div>
    <div class="section-intro" style="margin-top:30px"><h3>Recorded changes</h3><p>These are the material events currently loaded into the prototype.</p></div>
    <div class="alloc-grid">${db.options.map(o=>`<div><h4>${o.fund}</h4><div class="timeline">${o.history.map(e=>`<div class="timeline-event"><div class="date">${e.date} · ${e.severity}</div><h4>${e.title}</h4><p>${e.text} ${sourceButton({optionId:o.id,type:'generic',label:e.title,source:e.source,status:'issuer_verified',value:e.date})}</p></div>`).join('')}</div></div>`).join('')}</div>
  </div>`;
}

function sources(){
  return `<div class="section-pad">
    <div class="section-intro"><h3>Where did the numbers come from?</h3><p>We want the source list to be boring — because that means you can check the work yourself. Fund-issued public documents come first; APRA is kept as an independent regulatory layer.</p></div>
    <div class="plain-callout"><h4>What the source labels mean</h4><p><strong>Primary fund source</strong> means the value is tied directly to a public document or page from the super fund. <strong>Secondary cross-check</strong> means we have not yet deterministically extracted the exact value from the primary source, so we do not present it as fully verified.</p></div>
    <div class="evidence-list">${Object.entries(db.sources).map(([id,s])=>{
      const status=s.type==='issuer_primary'||s.type==='issuer_archive'?'issuer_verified':s.type==='regulator'?'regulator_verified':'secondary_crosscheck';
      const [text,cls]=statusText(status);
      return `<div class="evidence-row"><div><h4>${s.organisation} — ${s.title}</h4><p>${s.notes||''}</p></div><div><span class="status-label ${cls}">${text}</span><br><a class="source-link" href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></div></div>`;
    }).join('')}</div>
  </div>`;
}

function renderContent(){
  const renderers={
    'Summary':summary,
    'What you own':composition,
    'Returns':returns,
    'Fees':fees,
    "How it's changed":history,
    'Sources':sources
  };
  $('tabContent').innerHTML=renderers[currentTab]();
  bindEvidence();
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{compositionMode=b.dataset.mode;renderContent();});
  document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{historyYear=b.dataset.year;renderContent();});
  if(currentTab==='Fees'){
    $('balanceRange').oninput=updateFees;
    updateFees();
  }
}

function evidencePayload(el){
  try{return JSON.parse(el.dataset.evidence.replace(/&quot;/g,'"'));}catch{return null;}
}
function bindEvidence(){
  document.querySelectorAll('[data-evidence]').forEach(el=>el.onclick=ev=>{
    ev.stopPropagation();
    openEvidence(evidencePayload(el));
  });
}
function resolveEvidence(p){
  const o=db.options.find(x=>x.id===p.optionId);
  let srcId=p.source,status=p.status||'issuer_verified',value=p.value,note='';
  if(p.type==='performance'){
    const m=o.performance[p.key];
    srcId=m.source; status=m.status; value=fmtPct(m.value);
    if(m.issuerLink) note=`The fund's own performance page is also linked in the source registry.`;
  }
  if(p.type==='allocation') status='issuer_verified';
  return {o,src:db.sources[srcId],status,value,note,label:p.label};
}
function openEvidence(p){
  if(!p) return;
  const e=resolveEvidence(p);
  const [statusLabel,statusClass]=statusText(e.status);
  $('drawerTitle').textContent=e.label||'Source';
  $('drawerBody').innerHTML=`
    <div class="evidence-block"><div class="evidence-label">Value shown on this site</div><div class="evidence-main">${e.value??'See source'}</div><div class="evidence-status ${statusClass}">${statusLabel}</div></div>
    <div class="evidence-block"><div class="evidence-label">Investment option</div><div class="evidence-text"><strong>${e.o.fund} — ${e.o.option}</strong><br>${e.o.product}</div></div>
    <div class="evidence-block"><div class="evidence-label">Public source</div><div class="evidence-text"><strong>${e.src.organisation}</strong><br>${e.src.title}${e.src.reportingDate?`<br>Reporting date: ${e.src.reportingDate}`:''}${e.src.effectiveDate?`<br>Effective date: ${e.src.effectiveDate}`:''}</div><a class="source-link" href="${e.src.url}" target="_blank" rel="noopener">Open the original source ↗</a></div>
    ${e.src.notes?`<div class="evidence-block"><div class="evidence-label">Why we use it</div><div class="evidence-text">${e.src.notes}</div></div>`:''}
    ${e.note?`<div class="evidence-block"><div class="evidence-label">Note</div><div class="evidence-text">${e.note}</div></div>`:''}
  `;
  $('drawerBackdrop').hidden=false;
  $('evidenceDrawer').classList.add('open');
  $('evidenceDrawer').setAttribute('aria-hidden','false');
}
function closeEvidence(){
  $('drawerBackdrop').hidden=true;
  $('evidenceDrawer').classList.remove('open');
  $('evidenceDrawer').setAttribute('aria-hidden','true');
}

function openMethodology(){ $('methodologyModal').hidden=false; }
function closeMethodology(){ $('methodologyModal').hidden=true; }
function scrollBasics(){ $('superBasics').scrollIntoView({behavior:'smooth',block:'start'}); }

async function init(){
  try{
    const response=await fetch(DATA_URL,{cache:'no-store'});
    if(!response.ok) throw new Error(`Data request failed: ${response.status}`);
    db=await response.json();
    optionHeaders();
    renderTabs();
    renderContent();

    document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{
      viewMode=btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===viewMode));
      renderContent();
    });
    $('closeDrawer').onclick=closeEvidence;
    $('drawerBackdrop').onclick=closeEvidence;
    $('methodologyButton').onclick=openMethodology;
    $('closeMethodology').onclick=closeMethodology;
    $('basicsButton').onclick=scrollBasics;
    $('startGuideButton').onclick=scrollBasics;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEvidence();closeMethodology();}});
  }catch(err){
    console.error(err);
    $('tabContent').innerHTML=`<div class="section-pad"><div class="plain-callout warning"><h4>We couldn't load the comparison data.</h4><p>${err.message}</p></div></div>`;
  }
}
init();
