# Super Evidence V8 — Product Operating System

## Purpose

Super Evidence is not a comparison table and not a robo-adviser. It is the independent evidence and interpretation layer for Australian superannuation.

The system must serve three audiences without creating three separate products:

1. **First-time / low-confidence consumer** — wants a clear answer without jargon.
2. **Confident consumer** — wants to compare options, understand trade-offs and test assumptions.
3. **Adviser / analyst / researcher** — wants definitions, source dates, pathway context, methodology, benchmarks, histories and reproducible calculations.

The product solves this with **progressive depth** rather than a beginner mode and an expert mode.

---

## The five-layer experience

Every substantive screen should follow the same hierarchy.

### Layer 1 — Answer
What should a normal person understand in 10 seconds?

Examples:
- “This is a high-growth portfolio.”
- “Its representative fee is above the matched peer median.”
- “These two options are not strongly like-for-like.”

Maximum: one headline + two supporting sentences.

### Layer 2 — Picture
Show the concept visually before showing a dense table.

Preferred visual grammar:
- growth exposure → horizontal continuum
- portfolio → 100% stacked horizontal allocation bar
- fees → dollars at selected balance + simple component bar
- performance → long-term line or matched-period bars
- risk → growth / volatility / negative-return measures kept separate
- peer context → distribution or median marker, not a winner badge

### Layer 3 — Key facts
Show only the numbers needed to support Layer 1.

Default maximum: four headline metrics.

### Layer 4 — Explore
Let the user change balance, time horizon, comparison option, peer definition or chart period.

### Layer 5 — Evidence
Expose APRA fields, issuer documents, reporting dates, methodology definitions, pathway identifiers, calculations and history.

A consumer should be able to stop at Layer 1 or 2. A professional should be able to drill through Layer 5.

---

## The Super Evidence question engine

The site should be organised around questions people actually have, not database tables.

Primary question families:

1. **What is my money invested in?**
2. **How much risk am I taking?**
3. **Has my option performed well for the risk taken?**
4. **Am I paying more than comparable options?**
5. **How does my option compare with another?**
6. **What does my time horizon change?**
7. **What has changed in this option over time?**
8. **What are the assumptions behind this calculation?**

Each question must map to a defined set of evidence and must have an explicit stop condition when the data is insufficient.

No question may be answered by silently substituting a secondary source or a differently defined metric.

---

## Research Navigator contract

The Research Navigator is a factual research workflow, not a product-recommendation engine.

It may collect:
- the question the user wants answered;
- age and a user-selected retirement-planning age;
- fund;
- actual investment option;
- user-controlled comparison filters;
- optional balance for fee calculations.

It may then explain:
- time horizon;
- current strategic growth exposure;
- risk measures separately;
- matched peer medians;
- fee differences on the same representative balance;
- portfolio allocations;
- historical return context;
- what evidence is missing.

It must not automatically turn personal circumstances into “Option X is suitable for you”.

---

## Market model

Canonical hierarchy:

**RSE / Fund → Product → Investment Menu → Investment Option → Investment Pathway**

The consumer UI may collapse duplicated pathways, but the pathway must remain available in the evidence layer because member outcomes and fees can differ by access path.

### Consumer grouping

Each option should be classified for navigation into one of:
- diversified;
- indexed diversified;
- lifecycle stage / lifecycle strategy;
- responsible / screened diversified;
- single asset / specialist;
- direct investment;
- platform / external investment universe.

These are navigation labels, not performance rankings.

---

## Evidence system

Evidence completeness is categorical. Do not invent a 0–100 confidence score.

States:

1. **Structure mapped** — APRA identity/pathway only.
2. **Deep APRA coverage** — structure + performance + strategy/allocation.
3. **APRA + issuer verified** — APRA layer reconciled with issuer disclosure.
4. **Deep verified history** — current issuer + regulator + historical versions/lineage.

Each metric retains:
- source organisation;
- publication;
- reporting date;
- effective date if different;
- pathway / option identity;
- raw value;
- displayed/normalised value;
- methodology / definition;
- verification status;
- derivation formula and inputs if calculated.

---

## Peer engine

A peer comparison is valid only when its rules are visible.

Default peer construction:
- same product phase;
- same APRA growth band;
- same APRA return methodology/basis;
- public-offer records by default;
- sufficient history for the metric being compared.

A peer set must display:
- peer count;
- growth band;
- phase;
- return basis;
- reporting period;
- any additional filters.

The system may show median and percentile context, but must not convert that into a universal “best option” score.

---

## Comparability gate

Before comparing headline performance, the system tests:

- same phase?
- same return basis?
- same APRA growth band?
- growth exposure within 10 percentage points?
- same broad option type where known?
- matched return period?

Output states:

### Strongly comparable
All core dimensions align.

### Usable with context
One material dimension differs and is clearly stated.

### Weak comparison
Multiple material dimensions differ. Headline return differences may be displayed only with a warning and must not be framed as a verdict.

---

## Risk language

Never show a universal “risk %”.

Keep separate:
- strategic growth exposure;
- APRA growth band;
- issuer/APRA risk label;
- expected negative-return frequency where reported;
- 10-year volatility where available;
- liquidity/concentration/other risk characteristics where later sourced.

### Growth exposure above 100%

APRA may report strategic growth exposure above 100% for leveraged/derivative structures. The UI must label this explicitly as **growth exposure above 100% / leveraged exposure**, never “130% risk”.

---

## Return system

Return concepts remain distinct:
- gross investment return;
- net investment return;
- gross investment return net of fees;
- member net return;
- benchmark-relative return;
- real return after inflation (derived).

The site must show the exact basis whenever options are compared.

Real return formula:

`(1 + nominal return) / (1 + inflation) - 1`

Do not use simple subtraction except as an explicitly labelled approximation.

---

## Fee system

Fees are always contextualised by:
- representative balance;
- phase/product/pathway;
- fee type;
- reporting period.

Consumer default:
- show dollars first;
- show percentage underneath;
- allow balance change where formula data permits.

Research detail:
- administration;
- investment;
- transaction;
- advice where relevant;
- other costs;
- taxes where reported;
- reserve-funded costs;
- formula/cap/tier.

---

## Calculator standard

Every calculator must have four visible sections:

1. **What this calculator answers**
2. **Inputs**
3. **Result**
4. **Assumptions & exclusions**

Every result must show both nominal and today’s-dollar values where inflation matters.

Projection calculator assumptions must explicitly identify:
- return basis;
- investment fee;
- administration fee;
- contribution timing;
- inflation;
- contribution growth;
- tax treatment;
- insurance treatment;
- contribution-cap treatment;
- sequence-of-returns treatment.

No hidden default may materially drive the result.

---

## Persistent research workspace — no account required

The site should work fully without sign-in.

Use local browser storage for an optional research workspace containing:
- last fund viewed;
- last option viewed;
- comparison A/B;
- optional balance;
- chosen research question;
- recently viewed options;
- saved option IDs.

The workspace must be clearly described as stored on the device/browser, not in a Super Evidence account.

No personal profile is required to explore the market.

---

## Homepage system

Homepage has four jobs only:

1. explain what Super Evidence is;
2. prove breadth/independence;
3. help someone start with a question or fund;
4. establish trust in evidence.

Do not place a ranking table on the homepage.

Recommended top sequence:

1. **Hero** — “Know what your super is actually doing.”
2. **Live market proof** — funds mapped, option records, comparable-metric coverage, pathways.
3. **Ask your question** — six visual question cards.
4. **Search a fund** — official branding where available.
5. **How evidence works** — APRA / issuer / derived.
6. **Calculators** — one featured example only.
7. **Research/professional depth** — restrained invitation, not a dashboard.

---

## Fund page system

Order:

1. official fund brand + short identity;
2. one-line “what this fund offers” summary;
3. products / phases presented visually;
4. investment option groups;
5. search within fund;
6. evidence coverage indicator;
7. advanced fund-level research.

Avoid showing pathways as a consumer list unless needed.

Platform products must use search/filter, not thousands of cards.

---

## Option page system

Default view:

### “Three things to know”
Generated only from defensible data:
- growth/risk picture;
- long-term performance context;
- fee context or portfolio distinction.

Then:
1. growth/risk visual;
2. portfolio allocation visual;
3. long-term performance visual;
4. fee-at-balance visual;
5. matched peer context;
6. history/change events;
7. research detail and sources.

Maximum four headline numbers before scrolling.

---

## Comparison page system

First output is **What stands out?**, not a 20-row matrix.

Show up to four neutral takeaways:
- comparability quality;
- growth-exposure difference;
- long-term return difference only when basis is sufficiently aligned;
- fee-dollar difference at selected balance;
- volatility difference if available.

Then show visual comparisons.

Never output an overall winner score.

---

## Professional / research layer

The same pages should expose advanced panels for:
- full APRA fields;
- strategic ranges;
- benchmark-relative return;
- Simple Reference Portfolio comparison;
- SAA benchmark comparison;
- 3/5/7/10-year periods;
- volatility;
- representative fees by balance;
- product/pathway identity;
- lifecycle triggers;
- source documents;
- issuer disagreement;
- historical comparability;
- lineage / merger history;
- downloadable data later.

The professional layer should feel dense only after the user deliberately opens it.

---

## Data freshness

Every metric should have a freshness state:
- current reporting period;
- older reporting period;
- historical / potentially stale;
- date unavailable.

The system must never imply that March 2026 QSPS structure is a June 2026 product snapshot.

Latest annual CPPP metrics and broader quarterly QSPS coverage can coexist, provided their reporting contexts are explicit.

---

## Release gates

A production build cannot be promoted unless:

### Code
- JavaScript syntax passes;
- economic-engine regression tests pass;
- required data files parse;
- no fatal console errors in browser QA when browser tooling is available.

### Data
- >= 50 APRA fund entities;
- >= 10,000 option records;
- return values stay in plausible bounds;
- allocation totals are validated where appropriate;
- fee formulas reconcile to issuer examples when issuer-verified;
- >100% growth exposure is allowed but explicitly treated as leveraged exposure.

### UX
- global search returns funds only;
- option discovery happens within a fund or comparison/search context;
- every advanced section can be skipped by a beginner;
- no ranking/winner language is used without an explicit, narrow metric definition;
- every recommendation-like sentence is reviewed for the factual-information/personal-advice boundary.

---

## North-star measures

The product should eventually measure:

### Consumer comprehension
- user can identify their fund vs investment option;
- user can explain what growth exposure means;
- user can locate fees in dollars;
- user can identify what the portfolio invests in;
- user can recognise when a comparison is not like-for-like.

### Product trust
- evidence drawer/source opened;
- methodology accessed;
- corrections visible;
- no sponsored ranking.

### Research usefulness
- peer set used;
- compare flow completed;
- calculator assumptions changed;
- option history viewed;
- advanced research panel opened.

Success is not maximising page density. Success is making the Australian super system understandable without sacrificing analytical integrity.
