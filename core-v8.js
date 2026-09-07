/*
 * Super Evidence V8 core analysis engine
 *
 * Pure functions only. No DOM access, no network calls, no user tracking.
 * The goal is to make economic interpretation consistent across the homepage,
 * fund pages, option pages, comparison, research navigator and calculators.
 */

export const V8_CORE_VERSION = '8.0.0';

export const asNumber = value => {
  if (value === null || value === undefined || value === '') return null;
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
};

export const median = values => {
  const xs = values.map(asNumber).filter(v => v !== null).sort((a, b) => a - b);
  if (!xs.length) return null;
  const i = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[i] : (xs[i - 1] + xs[i]) / 2;
};

export const percentileRank = (value, values) => {
  const v = asNumber(value);
  const xs = values.map(asNumber).filter(x => x !== null).sort((a, b) => a - b);
  if (v === null || xs.length < 3) return null;
  const below = xs.filter(x => x < v).length;
  const equal = xs.filter(x => x === v).length;
  return ((below + 0.5 * equal) / xs.length) * 100;
};

export function growthDescriptor(growthPct, growthBand = null) {
  const g = asNumber(growthPct);
  if (g === null) {
    return {
      level: 'unknown',
      label: 'Growth exposure not available',
      plain: 'We do not infer growth exposure from an option name such as “Balanced” or “High Growth”.',
      leveraged: false,
    };
  }
  if (g > 100) {
    return {
      level: 'leveraged',
      label: 'Growth exposure above 100%',
      plain: 'APRA reports growth exposure above 100%. This can occur where an investment structure uses leverage or derivatives, so market exposure can exceed the money invested one-for-one.',
      leveraged: true,
      growthBand,
    };
  }
  if (g >= 90) return { level: 'very_high', label: 'Very high growth exposure', plain: 'Almost all of the strategic portfolio is exposed to growth assets. Large short-term movements are more plausible, while the long-term return objective is generally higher.', leveraged: false, growthBand };
  if (g >= 75) return { level: 'high', label: 'High growth exposure', plain: 'Most of the strategic portfolio is exposed to growth assets. Short-term falls can be meaningful, so the investment is usually considered with a longer horizon.', leveraged: false, growthBand };
  if (g >= 60) return { level: 'growth', label: 'Growth-oriented', plain: 'Growth assets are the majority of the strategic portfolio, with a meaningful defensive allocation alongside them.', leveraged: false, growthBand };
  if (g >= 40) return { level: 'balanced', label: 'More balanced growth exposure', plain: 'The strategic portfolio has a more even mix of growth and defensive assets than a typical high-growth option.', leveraged: false, growthBand };
  if (g > 0) return { level: 'defensive', label: 'More defensive', plain: 'Defensive assets make up most of the strategic portfolio. That usually lowers market exposure, but can also lower long-term return potential.', leveraged: false, growthBand };
  return { level: 'cash_defensive', label: 'No APRA growth exposure', plain: 'APRA reports no strategic growth-asset exposure for this option.', leveraged: false, growthBand };
}

export function riskPicture({ growthPct = null, growthBand = null, volatility10yPct = null, riskLabel = null, negativeReturns20y = null } = {}) {
  const growth = growthDescriptor(growthPct, growthBand);
  const vol = asNumber(volatility10yPct);
  const parts = [];
  if (riskLabel) parts.push(`Issuer/APRA risk label: ${riskLabel}.`);
  if (negativeReturns20y !== null && negativeReturns20y !== undefined && negativeReturns20y !== '') parts.push(`Reported negative-return expectation: ${negativeReturns20y} over 20 years.`);
  if (vol !== null) parts.push(`Reported 10-year volatility: ${vol.toFixed(2)}%.`);
  parts.push(growth.plain);
  return {
    growth,
    volatility10yPct: vol,
    riskLabel,
    negativeReturns20y,
    explanation: parts.join(' '),
    warning: 'Growth exposure is not a universal “risk percentage”. Risk can also be described by volatility, expected negative-return frequency, liquidity, concentration and other characteristics.',
  };
}

export function evidenceCompleteness({ structure = false, performance = false, strategy = false, issuer = false, history = false } = {}) {
  const layers = [
    ['structure', Boolean(structure), 'APRA market structure'],
    ['performance', Boolean(performance), 'APRA performance'],
    ['strategy', Boolean(strategy), 'APRA strategy / allocation'],
    ['issuer', Boolean(issuer), 'Issuer verification'],
    ['history', Boolean(history), 'Historical versions'],
  ];
  const present = layers.filter(([, ok]) => ok).map(([id, , label]) => ({ id, label }));
  const missing = layers.filter(([, ok]) => !ok).map(([id, , label]) => ({ id, label }));
  let level = 'structure_only';
  let label = 'Structure mapped';
  if (structure && performance && strategy) { level = 'regulator_deep'; label = 'Deep APRA coverage'; }
  if (structure && performance && strategy && issuer) { level = 'issuer_verified'; label = 'APRA + issuer verified'; }
  if (structure && performance && strategy && issuer && history) { level = 'full'; label = 'Deep verified history'; }
  return { level, label, present, missing };
}

export function buildPeerSet(subject, universe, { requireGrowthBand = true, requirePhase = true, requireReturnBasis = true, publicOnly = true } = {}) {
  if (!subject) return [];
  if ((requireGrowthBand && !subject.growth_band) ||
      (requirePhase && !subject.phase) ||
      (requireReturnBasis && !subject.performance_basis)) return [];
  return (universe || []).filter(x => {
    if (!x || (x.fund === subject.fund && String(x.option_id) === String(subject.option_id))) return false;
    if (publicOnly && x.public_offer_status && String(x.public_offer_status).toLowerCase().includes('non-public')) return false;
    if (requirePhase && subject.phase && x.phase !== subject.phase) return false;
    if (requireGrowthBand && subject.growth_band && x.growth_band !== subject.growth_band) return false;
    if (requireReturnBasis && subject.performance_basis && x.performance_basis !== subject.performance_basis) return false;
    return true;
  });
}

export function peerContext(subject, universe) {
  const peers = buildPeerSet(subject, universe);
  const returns = peers.map(x => x.return_10y_pct);
  const fees = peers.map(x => x.fee_100k_pct);
  const vols = peers.map(x => x.volatility_10y_pct);
  const result = {
    peerCount: peers.length,
    peerDefinition: {
      phase: subject?.phase || null,
      growthBand: subject?.growth_band || null,
      performanceBasis: subject?.performance_basis || null,
      publicOnly: true,
    },
    return10y: null,
    fee100k: null,
    volatility10y: null,
  };
  const r = asNumber(subject?.return_10y_pct);
  const f = asNumber(subject?.fee_100k_pct);
  const v = asNumber(subject?.volatility_10y_pct);
  const rMed = median(returns), fMed = median(fees), vMed = median(vols);
  if (r !== null && rMed !== null) result.return10y = { value: r, median: rMed, difference: r - rMed, percentile: percentileRank(r, returns.concat(r)) };
  if (f !== null && fMed !== null) result.fee100k = { value: f, median: fMed, difference: f - fMed, percentile: percentileRank(f, fees.concat(f)), lowerIsCheaper: true };
  if (v !== null && vMed !== null) result.volatility10y = { value: v, median: vMed, difference: v - vMed, percentile: percentileRank(v, vols.concat(v)) };
  return result;
}

export function comparability(a, b) {
  if (!a || !b) return { level: 'incomplete', comparable: false, issues: ['Choose two options.'] };
  const issues = [];
  const missing = [];
  if (!a.phase || !b.phase) missing.push('product phase');
  else if (a.phase !== b.phase) issues.push('Different product phases');
  if (!a.performance_basis || !b.performance_basis) missing.push('APRA return methodology');
  else if (a.performance_basis !== b.performance_basis) issues.push('Different APRA return methodologies');
  if (!a.growth_band || !b.growth_band) missing.push('APRA growth band');
  else if (a.growth_band !== b.growth_band) issues.push('Different APRA growth bands');
  const ga = asNumber(a.growth_weight_pct), gb = asNumber(b.growth_weight_pct);
  if (ga === null || gb === null) missing.push('strategic growth exposure');
  else if (Math.abs(ga - gb) > 10) issues.push(`Growth exposure differs by ${Math.abs(ga - gb).toFixed(1)} percentage points`);
  const typeA = a.option_type || a.segment;
  const typeB = b.option_type || b.segment;
  if (typeA && typeB && typeA !== typeB) issues.push('Different broad option or product types');
  if (missing.length) issues.push(`Missing comparison basis: ${missing.join(', ')}`);
  const level = missing.length || issues.length > 1 ? 'weak' : issues.length === 1 ? 'usable_with_context' : 'strong';
  return {
    level,
    comparable: level !== 'weak',
    issues,
    explanation: level === 'strong'
      ? 'These records share the key APRA comparison dimensions. Their underlying portfolios can still differ.'
      : level === 'usable_with_context'
        ? 'This comparison is usable if the stated difference is kept in mind.'
        : 'Headline return differences should not be treated as evidence that one option is better because the exposures or methodologies are materially different.',
  };
}

export function comparisonTakeaways(a, b) {
  const fit = comparability(a, b);
  const takeaways = [];
  const ga = asNumber(a?.growth_weight_pct), gb = asNumber(b?.growth_weight_pct);
  const ra = asNumber(a?.return_10y_pct), rb = asNumber(b?.return_10y_pct);
  const fa = asNumber(a?.fee_100k_pct), fb = asNumber(b?.fee_100k_pct);
  const va = asNumber(a?.volatility_10y_pct), vb = asNumber(b?.volatility_10y_pct);

  if (ga !== null && gb !== null) {
    const d = ga - gb;
    takeaways.push(Math.abs(d) < 3
      ? `Growth exposure is very similar (${ga.toFixed(1)}% vs ${gb.toFixed(1)}%).`
      : `${d > 0 ? a.option_name : b.option_name} has ${Math.abs(d).toFixed(1)} percentage points more APRA growth exposure.`);
  }
  if (fit.level === 'strong' && ra !== null && rb !== null) {
    const d = ra - rb;
    takeaways.push(Math.abs(d) < 0.05
      ? 'The published 10-year investment returns are effectively level on this basis.'
      : `${d > 0 ? a.option_name : b.option_name} has the higher published 10-year investment return by ${Math.abs(d).toFixed(2)} percentage points p.a.`);
  } else if (ra !== null && rb !== null) {
    takeaways.push('Both long-term returns are available, but the comparison is not sufficiently like-for-like to treat the difference as a clean performance verdict.');
  }
  if (fa !== null && fb !== null) {
    const dollars = Math.abs(fa - fb) / 100 * 100000;
    takeaways.push(Math.abs(fa - fb) < 0.01
      ? 'Representative total fees at $100,000 are very similar.'
      : `${fa < fb ? a.option_name : b.option_name} is cheaper on the loaded $100,000 representative pathway by about $${dollars.toFixed(0)} a year.`);
  }
  if (va !== null && vb !== null) {
    const d = va - vb;
    if (Math.abs(d) >= 0.25) takeaways.push(`${d > 0 ? a.option_name : b.option_name} has reported higher 10-year volatility on the APRA measure.`);
  }
  return { fit, takeaways: takeaways.slice(0, 4) };
}

export function timeHorizon({ age, retirementAge }) {
  const a = asNumber(age), r = asNumber(retirementAge);
  if (a === null || r === null || r < a) return { years: null, band: 'unknown', explanation: 'Enter a current age and a later planning age.' };
  const years = r - a;
  let band = 'short';
  let explanation = 'The selected horizon is relatively short, so the timing of market falls can matter more.';
  if (years >= 20) { band = 'very_long'; explanation = 'The selected horizon is long. A long horizon can increase the capacity to ride through market cycles, but it does not by itself determine which option is suitable.'; }
  else if (years >= 10) { band = 'long'; explanation = 'The selected horizon spans multiple market cycles. Risk tolerance, retirement needs and other circumstances still matter.'; }
  else if (years >= 5) { band = 'medium'; explanation = 'The selected horizon is medium term. The impact of a major market decline becomes more relevant as withdrawals approach.'; }
  return { years, band, explanation };
}

export function buildResearchBrief({ intent, age, retirementAge, subject, universe = [] } = {}) {
  const horizon = timeHorizon({ age, retirementAge });
  const peers = subject ? peerContext(subject, universe) : null;
  const risk = subject ? riskPicture({ growthPct: subject.growth_weight_pct, growthBand: subject.growth_band, volatility10yPct: subject.volatility_10y_pct, riskLabel: subject.risk_label, negativeReturns20y: subject.negative_returns_20y }) : null;
  const common = {
    intent,
    horizon,
    subject,
    peers,
    risk,
    disclaimer: 'This is factual research and transparent comparison, not a personal recommendation to choose, keep or switch a financial product.',
  };

  const answers = [];
  if (!subject) return { ...common, answers: [{ title: 'Find your actual investment option', text: 'The fund name is only the provider. The investment option is what determines the portfolio you hold.' }] };

  if (intent === 'risk') {
    answers.push({ title: risk.growth.label, text: risk.growth.plain });
    if (risk.volatility10yPct !== null) answers.push({ title: 'Observed volatility', text: `APRA reports ${risk.volatility10yPct.toFixed(2)}% 10-year volatility. This describes the variability of historical returns, not the worst loss you could experience.` });
    answers.push({ title: 'Time horizon', text: horizon.explanation });
  } else if (intent === 'fees') {
    if (peers?.fee100k) answers.push({ title: peers.fee100k.difference <= 0 ? 'At or below the peer median' : 'Above the peer median', text: `On the matched $100,000 APRA basis, this option is ${Math.abs(peers.fee100k.difference).toFixed(2)} percentage points ${peers.fee100k.difference <= 0 ? 'below' : 'above'} the peer median. Compare the exact pathway and balance before acting on the result.` });
    else answers.push({ title: 'Matched fee comparison not yet available', text: 'Fee comparisons are only shown when the representative balance and product/pathway basis are aligned.' });
  } else if (intent === 'performance') {
    if (peers?.return10y) answers.push({ title: peers.return10y.difference >= 0 ? 'Above the matched peer median' : 'Below the matched peer median', text: `The 10-year investment return is ${Math.abs(peers.return10y.difference).toFixed(2)} percentage points p.a. ${peers.return10y.difference >= 0 ? 'above' : 'below'} the median of the matched peer set.` });
    answers.push({ title: 'Do not stop at the return number', text: 'Growth exposure, volatility, fees, strategy changes and benchmark-relative returns are needed before attributing a return difference to investment skill.' });
  } else if (intent === 'age') {
    answers.push({ title: `${horizon.years ?? '—'}-year planning horizon`, text: horizon.explanation });
    answers.push({ title: risk.growth.label, text: `Your current option has ${asNumber(subject.growth_weight_pct) === null ? 'unavailable' : `${asNumber(subject.growth_weight_pct).toFixed(1)}%`} APRA growth exposure. The site does not convert your age into an automatic product recommendation.` });
  } else if (intent === 'holdings') {
    answers.push({ title: 'Start with the strategic asset mix', text: 'Portfolio allocation explains what economic exposures are driving the option. Listed/unlisted and hedged/unhedged detail should remain available beneath the plain-English grouping.' });
  } else if (intent === 'compare') {
    answers.push({ title: 'Compare true peers first', text: `${peers?.peerCount ?? 0} other loaded records currently match this option’s phase, APRA growth band and return methodology.` });
  }
  return { ...common, answers };
}

export function realReturn(nominalPct, inflationPct) {
  const n = asNumber(nominalPct), i = asNumber(inflationPct);
  if (n === null || i === null || i <= -100) return null;
  return ((1 + n / 100) / (1 + i / 100) - 1) * 100;
}

export function projectSuper({
  startingBalance = 100000,
  annualContribution = 12000,
  years = 25,
  returnBeforeInvestmentFeesPct = 7.0,
  investmentFeePct = 0.5,
  annualAdminFee = 100,
  inflationPct = 2.5,
  contributionGrowthPct = 0,
  contributionsPerYear = 12,
} = {}) {
  let balance = Math.max(0, asNumber(startingBalance) || 0);
  let contribution = Math.max(0, asNumber(annualContribution) || 0);
  const y = Math.max(0, Math.floor(asNumber(years) || 0));
  const gross = (asNumber(returnBeforeInvestmentFeesPct) || 0) / 100;
  const invFee = Math.max(0, asNumber(investmentFeePct) || 0) / 100;
  const admin = Math.max(0, asNumber(annualAdminFee) || 0);
  const inflation = (asNumber(inflationPct) || 0) / 100;
  const contGrowth = (asNumber(contributionGrowthPct) || 0) / 100;
  const periods = Math.max(1, Math.floor(asNumber(contributionsPerYear) || 12));
  const netAnnual = gross - invFee;
  const periodRate = Math.pow(1 + netAnnual, 1 / periods) - 1;
  let totalContributions = 0;
  let totalAdminFees = 0;
  let totalInvestmentFeesApprox = 0;

  for (let year = 0; year < y; year++) {
    const perContribution = contribution / periods;
    for (let p = 0; p < periods; p++) {
      totalInvestmentFeesApprox += balance * invFee / periods;
      balance *= 1 + periodRate;
      balance += perContribution;
      totalContributions += perContribution;
    }
    balance = Math.max(0, balance - admin);
    totalAdminFees += Math.min(admin, balance + admin);
    contribution *= 1 + contGrowth;
  }
  const realBalance = balance / Math.pow(1 + inflation, y);
  const realNetReturn = realReturn(netAnnual * 100, inflation * 100);
  return {
    endingBalanceNominal: balance,
    endingBalanceTodayDollars: realBalance,
    totalContributions,
    totalAdminFees,
    totalInvestmentFeesApprox,
    netReturnAfterInvestmentFeePct: netAnnual * 100,
    realNetReturnPct: realNetReturn,
    assumptions: {
      contributionTiming: `${periods} equal contributions per year`,
      returnConvention: 'Entered investment return is before the explicit investment-fee assumption; investment tax is assumed already reflected in the entered return.',
      adminFeeTiming: 'Annual administration fee deducted at year end.',
      inflation: 'Used only to convert the final nominal balance to today’s dollars.',
      exclusions: 'Insurance premiums, advice fees, contribution tax, concessional caps, tax on contributions, pension drawdowns and sequence-specific market returns are not modelled unless separately added in a future calculator version.',
    },
  };
}

export function dataFreshness(reportingDate, today = new Date()) {
  if (!reportingDate) return { status: 'unknown', months: null, label: 'Reporting date unavailable' };
  const d = new Date(reportingDate);
  if (Number.isNaN(d.getTime())) return { status: 'unknown', months: null, label: 'Reporting date unavailable' };
  const months = Math.max(0, (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth());
  if (months <= 4) return { status: 'current', months, label: 'Current reporting period' };
  if (months <= 12) return { status: 'watch', months, label: 'Older reporting period' };
  return { status: 'stale', months, label: 'Historical / potentially stale' };
}
