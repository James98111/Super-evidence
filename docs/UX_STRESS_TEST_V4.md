# Super Evidence — UX Stress Test V4

## Product goal
Super Evidence should work for an Australian who knows almost nothing about superannuation and still remain useful to an adviser, analyst or sophisticated investor.

The interface must therefore use **progressive depth** rather than separate beginner/pro modes:

1. **Plain-English meaning** — what is this and why should I care?
2. **Key numbers** — only the few facts needed to understand the choice.
3. **Research detail** — complete data, methodology, history, sources and assumptions on demand.

No user should need an account to use the core product.

---

## Stress-test personas

### Persona A — complete beginner
- Does not know the difference between a fund and an investment option.
- May not know what growth assets, defensive assets, indexed, active, MySuper, strategic allocation or p.a. mean.
- Wants to know: What is this? Is it expensive? Is it risky? What does it invest in? How has it gone over time?
- Fails if the page begins with jargon, dense tables, rankings, unexplained percentages or too many actions.

### Persona B — financially confident consumer
- Understands basic investing and super.
- Wants to compare options, fees, long-term returns and portfolio mix efficiently.
- Wants transparent assumptions and trustworthy sources.
- Fails if the site is too simplified or makes it hard to compare like with like.

### Persona C — adviser / analyst / researcher
- Needs full source provenance, effective dates, raw issuer labels, APRA-standardised measures, historical strategy, fees, benchmarks, methodology and exportable data.
- Fails if consumer simplification removes detail or silently transforms source data.

---

## Non-negotiable UX principles

### 1. Fund first
Global search returns super funds only. A fund is the primary navigation entity. Investment options live within the fund page.

### 2. Explain before measure
Never show an unfamiliar metric without a short explanation immediately available.

Example:
- **Growth exposure: 88%**
- “A higher growth allocation usually means more short-term ups and downs, with greater long-term growth potential.”

### 3. One decision per screen section
A section should answer one question:
- What is this fund?
- What options does it offer?
- How has this option performed?
- What does it invest in?
- What does it cost?

### 4. Default to the long term
For long-term options, 10-year performance is the headline where available. One-year performance is detail, not the hero number.

### 5. Compare like with like
Never imply that a higher raw return means “better” when risk/growth exposure materially differs.

### 6. No opaque rankings
Rankings are a secondary research tool only. Peer definition and methodology must be visible. Never pay-to-rank.

### 7. Missing is better than invented
If source quality is insufficient, show “Not yet verified”. Never silently substitute a lower-quality source.

### 8. Plain-English labels first, technical terminology second
Use:
- “What your money is invested in” before “asset allocation”.
- “How much it can move around” before “volatility”.
- “Long-term return” before “annualised performance”.

Technical terms can appear in research detail.

### 9. Real fund data remains intact
Simplified portfolio categories are an interface layer only. Original issuer asset labels and source dates remain available underneath.

### 10. Core site works anonymously
No login wall. Personal balance, saved comparisons and alerts are optional later enhancements.

---

## Market comparison framework
The product should ultimately cover the main consumer comparison dimensions:

1. Investment options
2. Investment performance
3. Fees and costs
4. Insurance
5. Services / member features

Additional Super Evidence research dimensions:
- Growth / defensive exposure
- Actual and strategic allocation
- Active vs indexed
- Listed vs unlisted exposure
- Currency exposure
- Benchmark-relative performance
- Real return after inflation
- Historical strategy changes
- Fund / option lineage
- Holdings and concentration
- APRA cross-checks
- Data quality and source provenance

---

## Homepage stress test

### Beginner must understand within 10 seconds
- This site covers Australian super funds.
- I can find a fund.
- I can compare funds/options.
- I can learn what the terms mean.

### Homepage must NOT show by default
- Rankings
- Dense return tables
- APRA terminology
- Strategy comparability scores
- Full fee formulas
- Long lists of investment options

### Homepage structure
1. Clear proposition
2. Fund-only search
3. Three primary actions: Find a fund / Compare / Learn
4. Australian fund market shelf
5. One calculator entry
6. Trust / methodology link in footer

---

## Fund page stress test

### First screen answers
- What is this organisation?
- How many investment options are currently covered?
- What kinds of options does it offer?
- Where do I start if I do not understand the option names?

### Beginner layer
- “A super fund is the provider. The investment option is how your money is invested.”
- Show investment-option categories with a one-line explanation.
- Default list columns: Option / Growth exposure / 10-year return / Investment cost.
- Risk, management style and other detail move behind “More details”.

### Research layer
- Product and menu structure
- All options/pathways
- Source coverage
- Insurance/services when loaded
- Fund-level APRA metrics

---

## Investment option page stress test

### Beginner layer
Start with “In plain English”.
Answer:
- What kind of option is this?
- Roughly how much is invested in growth assets?
- How much has it returned over the long term?
- What does it cost at an example balance?

Headline metrics: maximum four.

### Portfolio layer
Use simple broad categories first, then original issuer labels in an expandable research section.

### Performance layer
Headline 10-year where available.
Then 1 / 3 / 5 / 7 / 10-year history on demand.
Explain that longer history is only useful when the strategy remained comparable.

### Fee layer
Default to an example balance with a visible “Change balance” control.
Separate:
- fixed/admin fees
- asset-based admin fees
- investment/transaction costs
- reserve-funded costs
- insurance where applicable

### Research layer
- verification status
- source URL
- reporting/effective date
- raw allocation
- APRA-standardised allocation/growth
- methodology assumptions
- benchmark data
- real returns
- historical strategy changes

---

## Compare page stress test

### Builder
Use Fund A → Option A versus Fund B → Option B.
Never one giant option dropdown.

### Quick read
Before the table, provide a neutral factual interpretation:
- which has more growth exposure
- which currently costs less at the same balance
- historical long-term return difference
- whether the options look broadly comparable

No recommendation language.

### Beginner comparison
Show only:
1. Growth exposure / risk context
2. 10-year return
3. Estimated cost at same balance
4. Suggested timeframe

### Portfolio comparison
Use simplified side-by-side categories and plain-English notes.
Raw issuer labels remain available in “Research detail”.

### Advanced comparison
Expandable:
- all return horizons
- raw allocations
- active/indexed
- benchmarks
- real return
- historical allocation changes
- source provenance

---

## Learn experience
The learn area should be usable as a short sequence:

1. What is super?
2. What is a super fund?
3. What is an investment option?
4. What does growth / defensive mean?
5. What do returns mean?
6. What do fees mean?
7. What does a portfolio invest in?
8. How do I compare two options fairly?

Every relevant term in the data pages should link back to the same explanation.

---

## Calculators
Every calculator must display:
- what it can tell you
- what it cannot tell you
- every assumption
- units and timing conventions
- whether returns are before/after fees, tax and inflation
- ability to edit assumptions
- methodology version

No black-box forecasts.

Priority calculators:
1. Super projection
2. Fee impact over time
3. Contribution calculator
4. Real-return / inflation calculator
5. Retirement income illustration
6. Active-vs-indexed fee hurdle illustration

---

## Accessibility and usability checks
- Minimum 16px body text.
- Strong keyboard focus states.
- Buttons have clear text labels, not icon-only where meaning is ambiguous.
- Colour is never the only signal.
- Tables collapse into readable stacked layouts on mobile.
- Tooltips are supplementary; critical explanations are available without hover.
- No important interaction requires an account.
- Empty / missing data states explain what is missing and why.

---

## V4 success tests

A complete beginner should be able to answer, without external help:
1. What is a super fund?
2. What is an investment option?
3. What does this option broadly invest in?
4. Is it more or less growth-oriented than another option?
5. What has it returned over 10 years?
6. What would the disclosed fees roughly cost at the same balance?
7. Where did the numbers come from?

An adviser should be able to:
1. Open raw source evidence.
2. Inspect original asset labels.
3. See dates and verification state.
4. Compare matched horizons.
5. Access standardised methodology and assumptions.
6. Identify missing data rather than encountering silently imputed figures.

If either user cannot do these things, the page fails the stress test.
