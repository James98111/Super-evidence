const DATA_URL = './data/options.json';
let db;
let selectedOptionId;

const $ = (id) => document.getElementById(id);
const fmtPct = (v) => `${Number(v).toFixed(2).replace(/\.00$/, '')}%`;
const fmtMoney = (v) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v);
const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function statusLabel(status){
  if(status === 'issuer_verified') return ['Issuer verified',''];
  if(status === 'regulator_verified') return ['APRA verified',''];
  if(status === 'secondary_crosscheck') return ['Secondary cross-check','pending'];
  return ['Unverified','pending'];
}

function sourceButton(payload){
  return `<button class="source-button" data-evidence="${encodeURIComponent(JSON.stringify(payload))}">Source</button>`;
}

function optionById(id){ return db.options.find(o => o.id === id); }
function latestStrategic(o){ return o.strategic['2026'] || Object.values(o.strategic).at(-1); }
function fundGroups(){
  const map = new Map();
  db.options.forEach(o => {
    if(!map.has(o.fund)) map.set(o.fund, []);
    map.get(o.fund).push(o);
  });
  return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0]));
}

function switchView(view){
  ['find','compare','learn'].forEach(v => {
    const el = $(`${v}View`);
    el.hidden = v !== view;
  });
  document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  window.scrollTo({top:0, behavior:'smooth'});
  if(view === 'compare') renderComparison();
}

function renderDirectory(){
  const groups = fundGroups();
  $('coverageText').textContent = `${groups.length} funds · ${db.options.length} investment options loaded in this prototype`;
  $('fundDirectory').innerHTML = groups.map(([fund, options]) => `
    <div class="fund-row">
      <div><h3>${escapeHtml(fund)}</h3><p>${escapeHtml(options[0].product || '')}</p></div>
      <div class="fund-options">${options.map(o => escapeHtml(o.option)).join(' · ')}</div>
      <button class="link-button" data-open-option="${options[0].id}">View</button>
    </div>`).join('');
  document.querySelectorAll('[data-open-option]').forEach(btn => btn.onclick = () => showOption(btn.dataset.openOption));
}

function renderSearchResults(query){
  const box = $('searchResults');
  const q = query.trim().toLowerCase();
  $('clearSearch').hidden = !q;
  if(!q){ box.hidden = true; box.innerHTML = ''; return; }
  const matches = db.options.filter(o => [o.fund,o.product,o.option,`${o.fund} ${o.option}`].some(x => (x||'').toLowerCase().includes(q))).slice(0,12);
  box.innerHTML = matches.length ? matches.map(o => `
    <button class="search-result" data-search-option="${o.id}">
      <strong>${escapeHtml(o.fund)} — ${escapeHtml(o.option)}</strong>
      <span>${escapeHtml(o.product)} · ${escapeHtml(o.style)}</span>
    </button>`).join('') : `<div class="search-result"><strong>No match in the prototype yet</strong><span>The production version will cover the full market.</span></div>`;
  box.hidden = false;
  document.querySelectorAll('[data-search-option]').forEach(btn => btn.onclick = () => {
    showOption(btn.dataset.searchOption);
    $('globalSearch').value = '';
    box.hidden = true;
    $('clearSearch').hidden = true;
  });
}

function plainSummary(o){
  const strategic = latestStrategic(o);
  const top = [...strategic.allocation].sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0].toLowerCase());
  return `${o.option} is a ${o.style.toLowerCase()} option with ${o.growth}% classified as growth assets. Its largest published strategic exposures are ${top[0]} and ${top[1]}. The fund suggests a timeframe of ${o.suggestedTimeframe}.`;
}

function returnRow(o,key,label,explain=''){
  const m = o.performance[key];
  return `<div class="metric-row"><div class="label">${label}${explain?`<small>${explain}</small>`:''}</div><div class="metric-number">${fmtPct(m.value)} ${sourceButton({optionId:o.id,type:'performance',key,label})}</div></div>`;
}

function genericMetricRow(o,label,value,source,detail=''){
  return `<div class="metric-row"><div class="label">${label}${detail?`<small>${detail}</small>`:''}</div><div class="metric-number">${value} ${sourceButton({optionId:o.id,type:'generic',label,value,source,status:'issuer_verified'})}</div></div>`;
}

function calculateFees(o,balance){
  const c = o.costs;
  const adminPct = c.adminPercent.capBalance
    ? Math.min(balance,c.adminPercent.capBalance)*(c.adminPercent.value/100)
    : Math.min(balance*(c.adminPercent.value/100),c.adminPercent.annualCap ?? Infinity);
  const adminFixed = c.adminFixedAnnual.value;
  const reserve = balance*(c.reservePercent.value/100);
  const invest = balance*(c.investmentAndTransactionPct.value/100);
  return {adminFixed,adminPct,reserve,invest,total:adminFixed+adminPct+reserve+invest};
}

function allocationRows(o){
  const snap = latestStrategic(o);
  return snap.allocation.filter(x=>x[1]>0).map(([name,val]) => `
    <tr><td>${escapeHtml(name)}<div class="mini-bar"><span style="width:${Math.min(100,val)}%"></span></div></td><td>${fmtPct(val)}</td></tr>`).join('');
}

function showOption(id){
  selectedOptionId = id;
  const o = optionById(id);
  const strategic = latestStrategic(o);
  const fee100 = calculateFees(o,100000);
  const profile = $('optionProfile');
  profile.hidden = false;
  profile.innerHTML = `
    <div class="profile-top">
      <div class="profile-title">
        <div class="breadcrumb">${escapeHtml(o.fund)} / ${escapeHtml(o.product)}</div>
        <h1>${escapeHtml(o.option)}</h1>
        <p class="lead">${escapeHtml(plainSummary(o))}</p>
        <div class="profile-actions">
          <button class="primary-button" id="compareThis">Compare this option</button>
          <button class="secondary-button" data-scroll="sources-${o.id}">View sources</button>
        </div>
      </div>
      <div class="profile-atglance" aria-label="At a glance">
        <div class="atglance-row"><span>10-year return</span><strong>${fmtPct(o.performance['10y'].value)} p.a.</strong></div>
        <div class="atglance-row"><span>Growth assets</span><strong>${o.growth}%</strong></div>
        <div class="atglance-row"><span>Risk</span><strong>${escapeHtml(o.risk)}</strong></div>
        <div class="atglance-row"><span>Suggested timeframe</span><strong>${escapeHtml(o.suggestedTimeframe)}</strong></div>
        <div class="atglance-row"><span>Est. disclosed cost at $100k</span><strong>${fmtMoney(fee100.total)}/yr</strong></div>
      </div>
    </div>

    <div class="profile-body">
      <nav class="profile-nav" aria-label="Investment option sections">
        <button data-scroll="performance-${o.id}">Returns</button>
        <button data-scroll="portfolio-${o.id}">What you own</button>
        <button data-scroll="fees-${o.id}">Fees</button>
        <button data-scroll="changes-${o.id}">How it changed</button>
        <button data-scroll="sources-${o.id}">Sources</button>
      </nav>

      <div>
        <section id="performance-${o.id}" class="content-section">
          <h2>How has it performed?</h2>
          <p class="section-explainer">Returns show how the option has performed historically. Longer periods are generally more useful for a long-term option than one year alone.</p>
          <div class="metric-list">
            ${returnRow(o,'1y','1 year','Useful for what happened recently, but can be noisy.')}
            ${returnRow(o,'3y','3 years')}
            ${returnRow(o,'5y','5 years')}
            ${returnRow(o,'10y','10 years','A stronger long-term reference point when the strategy has remained comparable.')}
          </div>
          <div class="definition-note">Past performance does not tell you what will happen next. We keep strategy changes visible because a long return history can include an investment that looked different from today.</div>
          <details class="technical-details"><summary>Show technical return details</summary><div>Reporting date: ${db.meta.performanceAsAt}. Return status and source are attached to each figure. The production version will also include 7-year, rolling returns, benchmark comparisons and peer context where public data supports them.</div></details>
        </section>

        <section id="portfolio-${o.id}" class="content-section">
          <h2>What does your money actually own?</h2>
          <p class="section-explainer">The investment-option name is only a label. The allocation below is the fund's published strategic mix — the portfolio it is aiming to hold.</p>
          <div class="metric-list">
            ${genericMetricRow(o,'Growth assets',fmtPct(o.growth),strategic.source,'Generally higher expected long-term growth with larger short-term falls.')}
            ${genericMetricRow(o,'Defensive assets',fmtPct(o.defensive),strategic.source,'Generally used to reduce volatility and provide stability.')}
          </div>
          <table class="allocation-table"><thead><tr><th>Asset class</th><th>Strategic allocation</th></tr></thead><tbody>${allocationRows(o)}</tbody></table>
          <details class="technical-details"><summary>Show portfolio detail</summary><div>Strategic allocation effective ${escapeHtml(strategic.effective)}. Actual holdings may differ within the fund's permitted ranges. Where a reliable actual allocation is available, the production version will show strategic and actual side by side.</div></details>
        </section>

        <section id="fees-${o.id}" class="content-section">
          <h2>What could it cost?</h2>
          <p class="section-explainer">We translate the published fee formula into dollars. Change the balance to make the numbers meaningful.</p>
          <div class="fee-control"><label for="profileBalance">Your balance</label><input id="profileBalance" type="range" min="10000" max="500000" step="5000" value="100000"><strong id="profileBalanceValue">$100,000</strong></div>
          <div id="profileFeeRows" class="metric-list"></div>
          <details class="technical-details"><summary>Show fee formula detail</summary><div id="profileFeeFormula"></div></details>
        </section>

        <section id="changes-${o.id}" class="content-section">
          <h2>Has the investment changed?</h2>
          <p class="section-explainer">This matters because a ten-year return may not have been earned by exactly the portfolio you see today.</p>
          <div class="timeline-list">${o.history.map(e=>`<div class="timeline-item"><time>${escapeHtml(e.date)}</time><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.text)} ${sourceButton({optionId:o.id,type:'generic',label:e.title,value:e.date,source:e.source,status:'issuer_verified'})}</p></div>`).join('')}</div>
        </section>

        <section id="sources-${o.id}" class="content-section">
          <h2>Where did these numbers come from?</h2>
          <p class="section-explainer">Every public figure on this page is tied back to evidence. Click “Source” beside any number for the specific record.</p>
          <div class="metric-list">${Object.entries(db.sources).filter(([srcId]) => JSON.stringify(o).includes(srcId)).map(([srcId,s])=>`<div class="metric-row"><div class="label"><strong>${escapeHtml(s.organisation)}</strong><small>${escapeHtml(s.title)}</small></div><div class="metric-number"><a href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></div></div>`).join('')}</div>
        </section>
      </div>
    </div>`;

  $('compareThis').onclick = () => {
    $('compareA').value = o.id;
    switchView('compare');
  };
  document.querySelectorAll('[data-scroll]').forEach(btn => btn.onclick = () => document.getElementById(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'}));
  bindEvidence();
  const slider = $('profileBalance');
  slider.oninput = () => updateProfileFees(o, Number(slider.value));
  updateProfileFees(o, 100000);
  profile.scrollIntoView({behavior:'smooth',block:'start'});
}

function updateProfileFees(o,balance){
  const f = calculateFees(o,balance);
  $('profileBalanceValue').textContent = fmtMoney(balance);
  $('profileFeeRows').innerHTML = `
    <div class="metric-row"><div class="label">Estimated disclosed annual cost<small>Based on the published formula and selected balance.</small></div><div class="metric-number">${fmtMoney(f.total)} ${sourceButton({optionId:o.id,type:'fees',label:'Fee formula',value:fmtMoney(f.total),source:o.costs.adminFixedAnnual.source})}</div></div>
    <div class="metric-row"><div class="label">Approximate weekly equivalent</div><div class="metric-number">${fmtMoney(f.total/52)}</div></div>`;
  $('profileFeeFormula').innerHTML = `Account keeping: ${fmtMoney(f.adminFixed)}<br>Asset-based administration: ${fmtMoney(f.adminPct)}<br>Investment + transaction: ${fmtMoney(f.invest)}<br>Costs met from reserves: ${fmtMoney(f.reserve)}<br><br>Insurance, advice and member-specific activity fees are not included.`;
  bindEvidence();
}

function populateCompareSelectors(){
  const options = db.options.map(o => `<option value="${o.id}">${escapeHtml(o.fund)} — ${escapeHtml(o.option)}</option>`).join('');
  $('compareA').innerHTML = options;
  $('compareB').innerHTML = options;
  $('compareA').value = db.options[0]?.id || '';
  $('compareB').value = db.options[1]?.id || db.options[0]?.id || '';
  $('compareA').onchange = renderComparison;
  $('compareB').onchange = renderComparison;
}

function comparisonSourceCell(o,key,label){
  const m = o.performance[key];
  return `${fmtPct(m.value)} ${sourceButton({optionId:o.id,type:'performance',key,label})}`;
}

function renderComparison(){
  if(!db) return;
  const a = optionById($('compareA').value) || db.options[0];
  const b = optionById($('compareB').value) || db.options[1] || db.options[0];
  if(!a || !b) return;
  const fa = calculateFees(a,100000), fb = calculateFees(b,100000);
  const diff10 = a.performance['10y'].value - b.performance['10y'].value;
  const higher = diff10 === 0 ? null : diff10 > 0 ? a : b;
  $('compareSummary').innerHTML = `
    <div class="compare-heading"><div></div><div>${escapeHtml(a.fund)}<br>${escapeHtml(a.option)}</div><div>${escapeHtml(b.fund)}<br>${escapeHtml(b.option)}</div></div>
    <table class="compare-table">
      <tr><th>10-year return</th><td>${comparisonSourceCell(a,'10y','10-year return')}</td><td>${comparisonSourceCell(b,'10y','10-year return')}</td></tr>
      <tr><th>Growth assets</th><td>${a.growth}% ${sourceButton({optionId:a.id,type:'generic',label:'Growth assets',value:fmtPct(a.growth),source:latestStrategic(a).source,status:'issuer_verified'})}</td><td>${b.growth}% ${sourceButton({optionId:b.id,type:'generic',label:'Growth assets',value:fmtPct(b.growth),source:latestStrategic(b).source,status:'issuer_verified'})}</td></tr>
      <tr><th>Risk</th><td>${escapeHtml(a.risk)}</td><td>${escapeHtml(b.risk)}</td></tr>
      <tr><th>Suggested timeframe</th><td>${escapeHtml(a.suggestedTimeframe)}</td><td>${escapeHtml(b.suggestedTimeframe)}</td></tr>
      <tr><th>Est. disclosed cost at $100k</th><td>${fmtMoney(fa.total)}</td><td>${fmtMoney(fb.total)}</td></tr>
    </table>
    <div class="compare-callout"><strong>${higher ? `${higher.shortFund} has the higher published 10-year return in this comparison.` : 'The published 10-year returns are the same.'}</strong><p>${higher ? `The historical difference is ${Math.abs(diff10).toFixed(2)} percentage points per year. That does not make it a recommendation: the options also differ in risk, portfolio construction and fees.` : 'Returns alone do not make the options identical.'}</p></div>`;

  $('compareDetails').innerHTML = `
    <details><summary>Returns</summary><div class="detail-body"><table class="compare-table"><tr><th>1 year</th><td>${comparisonSourceCell(a,'1y','1-year return')}</td><td>${comparisonSourceCell(b,'1y','1-year return')}</td></tr><tr><th>3 years</th><td>${comparisonSourceCell(a,'3y','3-year return')}</td><td>${comparisonSourceCell(b,'3y','3-year return')}</td></tr><tr><th>5 years</th><td>${comparisonSourceCell(a,'5y','5-year return')}</td><td>${comparisonSourceCell(b,'5y','5-year return')}</td></tr><tr><th>10 years</th><td>${comparisonSourceCell(a,'10y','10-year return')}</td><td>${comparisonSourceCell(b,'10y','10-year return')}</td></tr></table></div></details>
    <details><summary>What they own</summary><div class="detail-body">${comparisonAllocationTable(a,b)}</div></details>
    <details><summary>Fees at my balance</summary><div class="detail-body"><div class="fee-control"><label for="compareBalance">Super balance</label><input id="compareBalance" type="range" min="10000" max="500000" step="5000" value="100000"><strong id="compareBalanceValue">$100,000</strong></div><div id="compareFeeTable"></div></div></details>
    <details><summary>How the strategies changed</summary><div class="detail-body"><div class="timeline-list">${[a,b].map(o=>`<h3>${escapeHtml(o.shortFund)}</h3>${o.history.map(e=>`<div class="timeline-item"><time>${escapeHtml(e.date)}</time><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.text)}</p></div>`).join('')}`).join('')}</div></div></details>
    <details><summary>Sources and verification</summary><div class="detail-body"><p class="section-explainer">Use the Source links beside individual figures for the exact evidence record. The production version will also show APRA cross-checks and discrepancy notices here.</p></div></details>`;
  bindEvidence();
  const bal = $('compareBalance');
  bal.oninput = () => updateCompareFees(a,b,Number(bal.value));
  updateCompareFees(a,b,100000);
}

function comparisonAllocationTable(a,b){
  const aa = latestStrategic(a).allocation, bb = latestStrategic(b).allocation;
  const names = [...new Set([...aa.map(x=>x[0]),...bb.map(x=>x[0])])];
  const val = (arr,name) => arr.find(x=>x[0]===name)?.[1] ?? '—';
  return `<table class="compare-table">${names.map(name=>`<tr><th>${escapeHtml(name)}</th><td>${typeof val(aa,name)==='number'?fmtPct(val(aa,name)):val(aa,name)}</td><td>${typeof val(bb,name)==='number'?fmtPct(val(bb,name)):val(bb,name)}</td></tr>`).join('')}</table>`;
}

function updateCompareFees(a,b,balance){
  $('compareBalanceValue').textContent = fmtMoney(balance);
  const fa=calculateFees(a,balance), fb=calculateFees(b,balance);
  $('compareFeeTable').innerHTML = `<table class="compare-table"><tr><th>Estimated annual disclosed cost</th><td>${fmtMoney(fa.total)} ${sourceButton({optionId:a.id,type:'fees',label:'Fee formula',value:fmtMoney(fa.total),source:a.costs.adminFixedAnnual.source})}</td><td>${fmtMoney(fb.total)} ${sourceButton({optionId:b.id,type:'fees',label:'Fee formula',value:fmtMoney(fb.total),source:b.costs.adminFixedAnnual.source})}</td></tr><tr><th>Approx. weekly equivalent</th><td>${fmtMoney(fa.total/52)}</td><td>${fmtMoney(fb.total/52)}</td></tr></table>`;
  bindEvidence();
}

function bindEvidence(){
  document.querySelectorAll('[data-evidence]').forEach(el => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      try{ openEvidence(JSON.parse(decodeURIComponent(el.dataset.evidence))); }catch{}
    };
  });
}

function resolveEvidence(p){
  const o = optionById(p.optionId);
  let srcId=p.source, status=p.status || 'issuer_verified', value=p.value, note='';
  if(p.type==='performance'){
    const m=o.performance[p.key]; srcId=m.source; status=m.status; value=fmtPct(m.value);
    if(m.issuerLink) note=`Issuer performance page: ${db.sources[m.issuerLink]?.url || ''}`;
  }
  const src=db.sources[srcId];
  return {o,src,status,value,note,label:p.label};
}

function openEvidence(p){
  const e=resolveEvidence(p); if(!e?.src || !e?.o) return;
  const [status,cls]=statusLabel(e.status);
  $('drawerTitle').textContent=e.label || 'Evidence';
  $('drawerBody').innerHTML=`
    <div class="evidence-block"><label>Displayed value</label><div class="evidence-value">${escapeHtml(e.value ?? 'See source')}</div><span class="status ${cls}">${status}</span></div>
    <div class="evidence-block"><label>Investment</label><div class="evidence-copy"><strong>${escapeHtml(e.o.fund)} — ${escapeHtml(e.o.option)}</strong><br>${escapeHtml(e.o.product)}</div></div>
    <div class="evidence-block"><label>Primary evidence</label><div class="evidence-copy"><strong>${escapeHtml(e.src.organisation)}</strong><br>${escapeHtml(e.src.title)}${e.src.reportingDate?`<br>Reporting date: ${escapeHtml(e.src.reportingDate)}`:''}${e.src.effectiveDate?`<br>Effective date: ${escapeHtml(e.src.effectiveDate)}`:''}<br><a class="source-link" href="${e.src.url}" target="_blank" rel="noopener">Open original source ↗</a></div></div>
    ${e.src.notes?`<div class="evidence-block"><label>Context</label><div class="evidence-copy">${escapeHtml(e.src.notes)}</div></div>`:''}
    ${e.note?`<div class="evidence-block"><label>Verification note</label><div class="evidence-copy">${escapeHtml(e.note)}</div></div>`:''}`;
  $('drawerBackdrop').hidden=false; $('evidenceDrawer').classList.add('open'); $('evidenceDrawer').setAttribute('aria-hidden','false');
}

function closeEvidence(){ $('drawerBackdrop').hidden=true; $('evidenceDrawer').classList.remove('open'); $('evidenceDrawer').setAttribute('aria-hidden','true'); }

function setupEvents(){
  document.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => switchView(btn.dataset.view));
  $('globalSearch').oninput = (e) => renderSearchResults(e.target.value);
  $('globalSearch').onfocus = (e) => { if(e.target.value.trim()) renderSearchResults(e.target.value); };
  $('clearSearch').onclick = () => { $('globalSearch').value=''; renderSearchResults(''); $('globalSearch').focus(); };
  $('closeDrawer').onclick=closeEvidence; $('drawerBackdrop').onclick=closeEvidence;
  $('methodologyButton').onclick=()=> $('methodologyModal').hidden=false;
  $('closeMethodology').onclick=()=> $('methodologyModal').hidden=true;
  $('methodologyModal').onclick=(e)=>{if(e.target===$('methodologyModal')) $('methodologyModal').hidden=true;};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEvidence();$('methodologyModal').hidden=true;}});
}

async function init(){
  const res=await fetch(DATA_URL); if(!res.ok) throw new Error('Unable to load option data');
  db=await res.json();
  renderDirectory();
  populateCompareSelectors();
  setupEvents();
  if(db.options[0]) selectedOptionId=db.options[0].id;
}

init().catch(err=>{
  document.querySelector('main').innerHTML=`<div class="page-head"><h1>We couldn't load the comparison data.</h1><p>${escapeHtml(err.message)}</p></div>`;
});
