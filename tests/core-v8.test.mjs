import assert from 'node:assert/strict';
import {
  growthDescriptor,
  evidenceCompleteness,
  comparability,
  comparisonTakeaways,
  realReturn,
  projectSuper,
  buildPeerSet,
  peerContext,
  timeHorizon,
} from '../core-v8.js';

// Growth exposure >100% is possible in APRA data and must be treated as
// leveraged exposure, never a fake universal 'risk percentage'.
assert.equal(growthDescriptor(130, '>100%').leveraged, true);
assert.equal(growthDescriptor(88, '75% - 90%').level, 'high');
assert.equal(growthDescriptor(null).level, 'unknown');

// Evidence status is categorical, not a made-up confidence score.
assert.equal(evidenceCompleteness({ structure: true }).label, 'Structure mapped');
assert.equal(evidenceCompleteness({ structure: true, performance: true, strategy: true }).label, 'Deep APRA coverage');
assert.equal(evidenceCompleteness({ structure: true, performance: true, strategy: true, issuer: true }).label, 'APRA + issuer verified');

const a = {
  option_id: 'a', option_name: 'High Growth A', phase: 'accumulation',
  growth_band: '75%-90%', growth_weight_pct: 85,
  performance_basis: 'net_investment_return', return_10y_pct: 9.5,
  fee_100k_pct: 0.65, volatility_10y_pct: 10.2,
};
const b = {
  option_id: 'b', option_name: 'High Growth B', phase: 'accumulation',
  growth_band: '75%-90%', growth_weight_pct: 87,
  performance_basis: 'net_investment_return', return_10y_pct: 9.0,
  fee_100k_pct: 0.80, volatility_10y_pct: 10.5,
};
const c = {
  option_id: 'c', option_name: 'Balanced C', phase: 'accumulation',
  growth_band: '40%-60%', growth_weight_pct: 55,
  performance_basis: 'net_investment_return', return_10y_pct: 7.2,
  fee_100k_pct: 0.60,
};

assert.equal(comparability(a, b).level, 'strong');
assert.equal(comparability(a, c).level, 'weak');
assert.equal(comparisonTakeaways(a, b).takeaways.length >= 3, true);

const peers = [b, c, { ...b, option_id: 'd', return_10y_pct: 8.7, fee_100k_pct: 0.75 }];
assert.equal(buildPeerSet(a, peers).length, 2);
assert.equal(peerContext(a, peers).peerCount, 2);

// Fisher/compound real return, not nominal-minus-inflation shortcut.
const rr = realReturn(10, 3);
assert.ok(Math.abs(rr - 6.7961165) < 0.0001);

assert.equal(timeHorizon({ age: 30, retirementAge: 67 }).years, 37);
assert.equal(timeHorizon({ age: 70, retirementAge: 65 }).years, null);

const projection = projectSuper({
  startingBalance: 100000,
  annualContribution: 12000,
  years: 20,
  returnBeforeInvestmentFeesPct: 7,
  investmentFeePct: 0.5,
  annualAdminFee: 100,
  inflationPct: 2.5,
});
assert.ok(projection.endingBalanceNominal > 100000);
assert.ok(projection.endingBalanceTodayDollars < projection.endingBalanceNominal);
assert.ok(projection.totalContributions > 0);
assert.equal(projection.assumptions.contributionTiming, '12 equal contributions per year');

console.log('Super Evidence V8 core tests passed');
