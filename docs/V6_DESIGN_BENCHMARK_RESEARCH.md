# Super Evidence V6 — Deep Design Benchmark Research

**Status:** Design research baseline before the V6 rebuild  
**Purpose:** Define a defensible, distinctive design language for Super Evidence by studying the strongest current consumer-finance, investing, retirement, comparison, research and high-trust digital products.

---

## 1. The design problem we are solving

Super Evidence has an unusually difficult UX brief. It must be simultaneously:

- understandable to an Australian who barely knows what superannuation is;
- useful to a financially confident consumer comparing real investment options;
- rigorous enough for an adviser, analyst or economist to inspect source data, history and methodology;
- capable of scaling from dozens to thousands of investment pathways without visually collapsing;
- neutral and evidence-led rather than sales-led;
- visually warm, premium and reassuring rather than bureaucratic or intimidating;
- clearly Australian without using clichéd Australian visual motifs;
- rebrandable later without rebuilding the product.

The wrong answer is to make one screen that tries to serve all three audiences at once. The right answer is **progressive depth**: a beautifully simple consumer surface backed by increasingly sophisticated research layers.

The design must feel like a purpose-built financial-services product, not a generic AI-generated dashboard.

---

## 2. Benchmark set

### A. Wealthsimple — editorial financial confidence

**Pages reviewed**
- https://www.wealthsimple.com/en-ca/invest
- https://www.wealthsimple.com/en-ca/invest/classic-portfolios
- https://www.wealthsimple.com/en-ca/automated-investing

**What is excellent**

1. **One idea per visual section.** The site does not try to explain every product attribute at once. A section makes one claim and supports it with one strong visual.
2. **Large editorial typography.** Financial content feels premium rather than technical because the page hierarchy is driven by confident type and whitespace, not card borders.
3. **Visual metaphors instead of financial-dashboard clutter.** Portfolio categories are introduced through memorable bespoke visuals rather than walls of metrics.
4. **Human language before mechanics.** “Low-fee, diversified, and as aggressive (or not) as you need” is far easier to absorb than a technical multi-asset definition.
5. **Risk is explained visually and contextually.** The Classic portfolio page explicitly connects higher risk with larger short-term swings and higher expected long-term returns.

**Adapt for Super Evidence**
- Large editorial headlines.
- One core takeaway per section.
- Use a bespoke visual for concepts such as growth-vs-defensive, diversification, fees and time horizon.
- Use plain-English descriptors next to issuer option names without renaming or editorialising the actual option.

**Do not copy**
- Sales language or product-specific persuasion.
- Wealthsimple’s proprietary illustration language.
- Promotional “target return” framing.

---

### B. Macquarie — institutional trust and premium restraint

**Pages reviewed**
- https://www.macquarie.com.au/
- https://www.macquarie.com.au/investing/

**What is excellent**

1. **Visual authority.** Strong black/deep-neutral treatments, disciplined typography and high-quality photography create immediate trust.
2. **Very few competing calls to action.** Large modules often communicate one product or action.
3. **Professional audience separation.** Consumer, adviser and broker pathways exist without forcing them into the same first-use experience.
4. **Confident use of whitespace and scale.** The design does not use decorative cards just because space exists.

**Adapt for Super Evidence**
- Premium photography used sparingly.
- Strong, disciplined masthead and section spacing.
- Professional/research functions available one layer deeper rather than crowding the consumer experience.
- Financial numbers should feel typographically important when they genuinely matter.

**Do not copy**
- Black-heavy visual identity as the primary Super Evidence palette.
- Product advertising composition.

---

### C. Moneybox — life-goal framing and visual utilities

**Page reviewed**
- https://www.moneyboxapp.com/

**What is excellent**

1. **The proposition is about life, not finance:** “Build wealth for what matters.”
2. **Product areas are visually distinct and easy to recognise.** Saving, home-buying, investing and pension each have a clear visual identity and short explanation.
3. **Tools are part of the experience.** Calculators and utilities are treated as useful destinations, not buried in a footer.
4. **Trust evidence sits below the primary task.** Reviews/protection marks do not crowd the hero.

**Adapt for Super Evidence**
- Calculators as a first-class destination.
- A homepage that helps users recognise their likely task rather than displaying market data immediately.
- Human outcomes: understand, compare, calculate, learn.

**Do not copy**
- App-store acquisition framing.
- Excessive lifestyle marketing.

---

### D. Monzo Investments — plain-English risk

**Page reviewed**
- https://monzo.com/investments

**What is excellent**

Monzo explains ready-made portfolios using labels and sentences ordinary people can understand. “Careful”, “Balanced” and “Adventurous” connect risk directly with the mix of bonds and shares and with the possibility of return.

**Adapt for Super Evidence**

We must preserve each fund’s official option name, but can add a neutral descriptor such as:

> **Aware High Growth**  
> Very high growth exposure · diversified portfolio

and then immediately explain:

> Most of this portfolio is invested in growth assets, which generally means larger short-term ups and downs and greater long-term growth potential.

This is interpretation of observable portfolio structure, not a recommendation.

**Do not copy**
- Invent consumer-friendly names that replace issuer names.
- Reduce risk to a single simplistic score.

---

### E. PensionBee — confidence as the emotional outcome

**Page reviewed**
- https://www.pensionbee.com/

**What is excellent**

The core promise is emotionally clear: **“Be Retirement Confident.”** It does not open with performance statistics or retirement-account mechanics.

**Adapt for Super Evidence**

The emotional outcome should be confidence and clarity:

> **Understand your super with confidence.**

Super Evidence should make the user feel less intimidated after every interaction.

---

### F. Betterment — one calm promise, then a few paths

**Page reviewed**
- https://www.betterment.com/

**What is excellent**

The current homepage begins with a simple outcome — “Build your wealth in the background” — then lets the user choose among a small number of account/product directions.

**Adapt for Super Evidence**
- One clear homepage promise.
- Three obvious tasks instead of a feature directory.
- Avoid exposing specialist tools before the user asks for them.

---

### G. Airbnb — task-first search

**Page reviewed**
- https://www.airbnb.com.au/

**What is excellent**

Airbnb is built on a very large inventory, but its homepage does not expose that complexity. The primary task is obvious through a compact search interaction.

**Adapt for Super Evidence**

Our inventory may eventually include every Australian fund, product, menu, option and pathway. The homepage should still initially ask for one thing:

> **Search a super fund**

The global search should return **funds only**. Investment options are explored inside a fund profile, preserving a clean mental model.

---

### H. MoneySmart — neutral Australian framing

**Pages reviewed**
- https://moneysmart.gov.au/how-super-works/choosing-a-super-fund
- https://moneysmart.gov.au/how-super-works/types-of-super-funds
- https://moneysmart.gov.au/grow-your-super/super-investment-options
- https://moneysmart.gov.au/grow-your-super/switching-super-funds
- https://moneysmart.gov.au/how-super-works/superannuation-calculator

**Critical structural insight**

MoneySmart identifies five important dimensions when comparing super funds:

1. Investment options
2. Investment performance
3. Fees
4. Insurance
5. Services

MoneySmart also recommends comparing similar investment options over the same period and looking at long-term performance rather than short-term results.

**Adapt for Super Evidence**

The complete fund-level data architecture should eventually cover all five dimensions, but the homepage should not show all five at once.

The fund page can eventually use a calm secondary navigation:

`Overview · Investment options · Fees · Insurance · Services`

Performance lives primarily at the investment-option level because that is where portfolio outcomes occur.

**Important framing rule**

Super Evidence should help users compare, but not imply that one universal “best fund” exists. The right comparison depends on what is actually being compared and on the investment option, fees, risk, insurance and services.

---

### I. Morningstar — professional research layer

**Page reviewed**
- https://www.morningstar.com.au/investments/ideas

**What is excellent**

Morningstar provides a disciplined professional filtering model: strategy, security type, asset allocation and other dimensions are intentionally filterable.

**Adapt for Super Evidence**

This belongs in the **research layer**, not the homepage.

Future Super Evidence Research/Screener filters can include:

- accumulation / pension / TTR;
- diversified / single sector;
- growth-exposure band;
- active / indexed;
- asset-allocation category;
- minimum track record;
- fee range;
- return horizon;
- source-verification status;
- strategy comparability;
- lifecycle / non-lifecycle;
- APRA benchmark / product-test dimensions.

This should feel powerful but optional.

---

### J. Portfolio Charts — visual economic analysis and methodological trust

**Pages reviewed**
- https://portfoliocharts.com/
- https://portfoliocharts.com/user-guide/
- https://portfoliocharts.com/user-guide/methodology/

**What is excellent**

1. **Neutral analytical purpose.** Charts are used to make complex investing concepts understandable rather than to sell a product.
2. **Methodology is first-class.** Assumptions are explicitly documented.
3. **Real returns use proper compounding**, not naïve subtraction.
4. **Charts focus on long-horizon questions** and intentionally filter short-term noise.
5. **The same calculation engine produces internally consistent results.**
6. **Historical outcomes and conservative/worst-case ranges are favoured over rosy averages.**

**Adapt for Super Evidence**

This should heavily influence our advanced economic-analysis layer:

- real return;
- rolling returns;
- historical drawdowns;
- strategy-change context;
- fee drag;
- benchmark-relative return;
- return versus growth exposure;
- actual versus strategic allocation;
- scenario calculators;
- explicit assumption panels.

Visual analysis should be neutral, transparent and reproducible.

---

### K. Finder and Canstar — functional lessons and anti-patterns

**Pages reviewed**
- https://www.finder.com.au/super-funds
- https://www.canstar.com.au/superannuation

**Useful ideas**
- clear filters;
- real market-comparison utility;
- common representative balance framing;
- sortable long-term returns and fees.

**What Super Evidence should deliberately avoid**

- dense result tables as the first experience;
- promoted products mixed into the core comparison;
- proprietary score as the dominant decision signal;
- too many return periods visible simultaneously;
- users needing to understand specialist terminology before they can proceed;
- default league-table behaviour that makes a complex product look like a single ranking problem.

Finder and Canstar belong closer to our advanced comparison/screener layer than our consumer homepage.

---

## 3. Usability research that should govern the design

### Progressive disclosure

Nielsen Norman Group’s progressive-disclosure principle is the single most important UX rule for Super Evidence: initially show a few important options and make specialised/advanced features available on request.

For Super Evidence, use **two levels only** in most places:

1. **Understand** — plain-English meaning + key visuals + essential numbers.
2. **Research detail** — source data + methodology + history + advanced metrics.

Avoid routinely creating third and fourth disclosure layers.

### Accordions and details

GOV.UK’s design-system guidance is useful:

- one small optional section → `Details`;
- several related optional sections → `Accordion`;
- tabs only when users genuinely need to switch quickly between mutually exclusive views.

Do not use tabs simply to hide a page that contains too much content. Simplify first.

### Charts

NN/g’s chart guidance favours **length and 2D position** for rapid quantitative understanding. Therefore:

- horizontal bars are excellent for fee and asset-allocation comparisons;
- line charts are excellent for a return series over time;
- stacked bars are excellent for portfolio composition;
- large decorative doughnuts should not become the default merely because they look attractive;
- call out important events directly on charts rather than expecting the user to remember context from surrounding text.

---

## 4. The Super Evidence design DNA

The final product should not visibly resemble one source. A useful synthesis is:

### Consumer surface

- **35% Wealthsimple** — editorial hierarchy, visual storytelling, one idea per section
- **20% Macquarie** — institutional trust, premium restraint, high-quality imagery
- **15% Moneybox / Monzo** — plain-English risk and friendly visual explanation
- **15% Airbnb** — task-first market navigation and search
- **15% MoneySmart** — neutral, Australian, factual, educational framing

### Adviser / research surface

- **40% Portfolio Charts** — neutral visual economic analysis and explicit assumptions
- **40% Morningstar** — filtering, screening, configurable research depth
- **20% Bloomberg-like discipline** — dense data only after the user deliberately enters the research layer

---

## 5. Visual identity rules

### Palette

Core:
- Warm ivory — `#FBF8F4`
- Deep navy — `#102A43`
- Terracotta — `#B85C43`
- Muted sage — `#5E7968`
- Warm stone — `#F3F1ED`
- White — `#FFFFFF`

Supporting data colours should be derived from these families rather than introducing a rainbow UI.

### Typography

Avoid default tech-product typography as the primary brand voice. Inter/Geist-style systems are excellent technically, but risk making the site feel like another software dashboard.

Recommended direction:
- **Editorial serif** for important headings and selected large metrics.
- **Humanist sans** for navigation, body copy, controls and data.

Current Source Serif 4 + Source Sans 3 remains a strong baseline. Alternatives to test visually before changing:
- Newsreader + Instrument Sans;
- Fraunces used very sparingly + Source Sans 3;
- Literata + IBM Plex Sans / Source Sans 3.

Do not use an overly fashionable display face that makes the site feel editorial at the expense of financial credibility.

### Spacing

Desktop spacing should be deliberately generous:
- page gutter: 48–64px desktop;
- major section separation: 96–128px;
- section heading to content: 32–48px;
- micro-components: 8/12/16/24px rhythm.

Whitespace is a hierarchy tool, not unused space.

### Radius and shadows

- Radius: 4–12px depending on component.
- Avoid ubiquitous 20–30px rounded cards.
- Most content should sit directly on the page separated by whitespace or thin rules.
- Shadows only where elevation has a functional meaning: search popover, dialog, floating menu.

---

## 6. Official fund-brand treatment

Fund brands are one of the fastest ways to communicate that Super Evidence covers the actual Australian super market.

### Rule

Use each fund’s **official public logo/brand mark** obtained from the issuer’s public website/assets or approved media resources.

Do not:
- recreate a fund logo from memory;
- substitute initials where a proper logo is available;
- recolour logos to match Super Evidence;
- distort aspect ratios;
- imply endorsement.

Always include a quiet independence note where appropriate:

> Fund names and logos are shown for identification. Super Evidence is independent and is not endorsed by the funds displayed.

### Homepage logo shelf

The shelf should feel closer to a professional market index than a sponsor wall:
- neutral background;
- consistent logo box height;
- real native colours;
- substantial spacing;
- no “Data loaded” badges next to logos;
- unavailable coverage can be visually quieter but should not make the page look incomplete.

---

## 7. Homepage V6 blueprint

### Goal

A first-time visitor must understand the product within 5 seconds.

### Header

Left: Super Evidence mark  
Right: `Funds` · `Compare` · `Calculators` · `Learn` · search icon

`About`, methodology, corrections and professional/research entry can live in the footer or secondary navigation.

### Hero

**Headline**  
`Understand your super with confidence.`

**Subline**  
`Explore Australian super funds, see what they invest in, and compare fees, risk and long-term performance in plain English.`

**Primary interaction**  
Large `Search a super fund` field.

Optional: one restrained, premium Australian lifestyle photo with substantial negative space. Do not put overlaid callout copy beside or on top of the person.

### Market proof

`Explore Australia's super funds`

A high-quality official-logo shelf.

### Three jobs only

1. **Explore funds** — See each fund and the investment options inside it.
2. **Compare options** — Compare two portfolios fairly.
3. **Calculators** — Model outcomes with assumptions you can change.

Each job receives one bespoke line icon and one sentence. No additional feature grid.

### “Super in 30 seconds” visual

Three visual nodes:

`Super fund → Investment option → What your money is invested in`

One sentence under each. This replaces paragraphs of introductory education.

### Calculator feature

One small visual showing how $100k might compound over time with a visible assumptions link.

### Footer

Trust architecture lives here:
- independence;
- methodology;
- evidence policy;
- corrections;
- disclaimer;
- data sources;
- professional/research link.

---

## 8. Fund profile V6 blueprint

### Goal

Answer: **What is this fund, and what choices does it offer?**

### Hero

Official logo + fund name.

One short neutral sentence.

Maximum four fund-level facts, only when genuinely useful and sourced, e.g.:
- members;
- assets under management;
- investment options;
- default/MySuper strategy.

Do not show “14/15 metrics loaded” or ingestion-state information to ordinary users.

### Secondary navigation

Future full coverage:

`Overview · Investment options · Fees · Insurance · Services`

Default to `Investment options` if the user arrived to explore investing.

### Investment options

Use visual groups, not one long market-data table:

- Diversified
- Indexed
- Social / responsible
- Single asset / specialist
- Lifecycle (where relevant)

Each option is a **meaningful object**, so a restrained card/row is justified.

Display initially:
- option name;
- plain-English descriptor;
- risk band/visual;
- 10-year return when verified;
- investment cost;
- growth exposure.

Hide secondary metrics until the option is opened.

### Visual sorting

Default order should follow the fund’s own menu architecture rather than “best performance”.

Allow optional user sort by:
- risk/growth;
- 10-year return;
- cost;
- alphabetical.

Do not default to a return league table.

---

## 9. Investment option V6 blueprint

### Goal

Answer: **What is this option, how risky is it, how has it performed, what does it cost, and what is it actually invested in?**

### Above the fold

Official fund logo + fund link  
Option name  
Neutral descriptor

Example:

> **Aware High Growth**  
> Very high growth exposure · diversified portfolio

Then exactly four primary visual facts:

1. **Risk** — visual risk scale + issuer risk label where verified
2. **Growth exposure** — large % + one-line meaning
3. **10-year return** — p.a. with reporting date + “historical, not forecast”
4. **Estimated annual cost** — dollars at selected balance

### Plain-English takeaway

Maximum 2 sentences.

Example:

> This is a long-term diversified option with most of its portfolio in growth assets. It can move around substantially in weaker markets, but is designed to pursue stronger growth over longer periods.

No “good”, “bad”, “best”, “winner” or implied recommendation.

### Portfolio allocation

Primary graphic: **100% stacked horizontal composition bar**.

Below: six-to-eight broad asset categories with small icons and percentages.

Click `See original fund labels` to reveal issuer-level categories.

Do not force a pie/donut chart where a stacked bar communicates comparison better.

### Performance

Start with the 10-year result.

Then a simple historical chart where full time-series data is available.

Secondary button: `See 1, 3, 5, 7 and 10-year returns`.

Advanced:
- real return;
- rolling return;
- benchmark-relative;
- drawdown;
- strategy-comparability flag.

### Fees

Interactive balance control:

`$50k · $100k · $250k · Other`

Hero output:
`About $X per year at a $100,000 balance`

Then one horizontal bar showing components. Detailed fee rules go into research detail.

### Risk

Show risk using:
- labelled scale;
- growth exposure;
- suggested timeframe;
- negative-year/risk statistics where sourced.

Avoid invented proprietary composite risk scores in the beginner layer.

### Research detail

One clearly labelled advanced region:

`Research detail & sources`

Contains:
- all return horizons;
- source URLs;
- reporting/effective dates;
- strategic/actual allocations;
- APRA standardisation;
- history and lineage;
- fee-rule calculation;
- benchmarks;
- holdings;
- methodology and discrepancy states.

---

## 10. Comparison V6 blueprint

### Goal

Answer: **How are these two portfolios meaningfully different?**

### Selection

`Fund A → Option A`  versus  `Fund B → Option B`

Do not place every Australian option into one giant dropdown.

### Quick read

Maximum four neutral takeaways:

- `Both options have very high growth exposure.`
- `ART has the lower estimated disclosed cost at $100,000.`
- `ART has the higher published 10-year historical return by 0.44 percentage points p.a.`
- `Their asset mix is similar overall, but Aware discloses more infrastructure/private-equity detail.`

If exposures differ materially, explicitly warn that raw-return comparison is less like-for-like.

### Visual comparison sequence

1. Risk / growth exposure
2. Annual cost in dollars
3. Long-term historical return
4. Portfolio allocation

One visual per concept. Avoid a large wall of side-by-side numbers.

### Portfolio comparison

Two horizontally aligned 100% stacked bars with the same category mapping and legend.

Then a `Where they differ most` list with the 2–3 largest allocation differences.

### Advanced comparison

`Detailed research comparison` reveals:
- all periods;
- real returns;
- actual vs strategic;
- historical strategy changes;
- fee components;
- benchmarks;
- source/date basis;
- comparability warnings;
- original fund labels.

No “overall winner” score.

---

## 11. Calculators V6 blueprint

### Consumer design

The initial calculator should have:
- one chart;
- one headline result;
- a small assumptions strip;
- `Change assumptions` control.

Do not begin with six numerical form fields.

### Assumption discipline

Every result should say exactly what is assumed:
- nominal/real return;
- inflation;
- contributions and timing;
- fees;
- tax treatment;
- wage growth where relevant;
- retirement age;
- whether volatility/sequence is modelled.

### Useful tools

1. Super projection
2. Fee impact
3. Contribution impact
4. Real return
5. Retirement income
6. Active-versus-indexed fee drag
7. Historical outcome range / sequence illustration

Projected and historical visuals must look different so users cannot confuse a scenario with an observed outcome.

---

## 12. Learn V6 blueprint

Do not build a textbook homepage.

Contextual learning is primary:

`88% growth exposure ⓘ`

Clicking explains that exact concept where the user needs it.

The Learn section itself can use question-based navigation:

- What is a super fund?
- What is an investment option?
- What does High Growth mean?
- How should I read long-term returns?
- What fees am I paying?
- What does my fund actually invest in?
- What are unlisted assets?
- What is indexed investing?
- How do I compare two options fairly?

Answers begin with a diagram or one-sentence explanation before detail.

---

## 13. Iconography

Create one bespoke line-icon family for:
- fund;
- investment option;
- compare;
- calculator;
- learn;
- performance;
- risk;
- fees;
- portfolio;
- shares;
- property;
- infrastructure;
- bonds;
- cash;
- evidence;
- history;
- verified source.

Style:
- 1.5–2px stroke;
- softly rounded joins/caps;
- simple geometry;
- no filled 3D illustrations;
- no emoji visual language;
- navy by default, terracotta/sage used sparingly.

---

## 14. Chart system

Use Recharts or equivalent SVG charts with responsive and accessible rendering.

### Allocation
- primary: 100% stacked horizontal bar;
- secondary: horizontal comparison bars where one asset class is the focus.

### Performance
- line chart;
- minimal grid;
- direct labels where practical;
- comparison lines use two strongly distinguishable but restrained brand-neutral colours;
- annotate strategy changes.

### Fees
- horizontal component bar or two-bar comparison;
- dollar result is visually primary, percentage detail secondary.

### Risk
- horizontal qualitative scale with explanatory anchors;
- never use red/green alone to imply bad/good.

### Accessibility
- visible chart title and summary;
- keyboard/screen-reader support;
- accompanying text/table view in detailed layer;
- do not encode differences using colour alone.

---

## 15. Component architecture: shadcn/ui

shadcn/ui is appropriate because its components are copied into the codebase and can be fully restyled rather than locking Super Evidence into a recognisable library look.

Recommended primitives:

- `Command` / combobox — fund search and advanced research search
- `Dialog` — search overlay and focused modal tasks
- `Accordion` — multiple advanced research groups
- `Collapsible` / `Details` equivalent — one optional explanation
- `Tabs` — only where fast switching is genuinely useful
- `Tooltip` — short definitions only
- `Slider` — balance / calculator assumptions where direct manipulation helps
- `Table` / data table — research layer, not beginner layer
- `Popover` — lightweight filters or definitions
- `Sheet` — mobile secondary filters if required

### Important anti-template rule

Do not retain default shadcn visual tokens. Components must be re-skinned with Super Evidence:
- typography;
- spacing;
- radius;
- colours;
- borders;
- states;
- iconography.

The goal is accessible behaviour without a recognisable “shadcn dashboard” appearance.

---

## 16. What to avoid — the AI-website blacklist

These patterns are explicitly prohibited unless there is a strong product reason:

- giant gradient hero backgrounds;
- glassmorphism;
- excessive pill chips;
- every section inside a rounded card;
- meaningless floating 3D coins/charts;
- generic AI illustrations of people holding money;
- hand-written annotation fonts;
- purple/blue SaaS gradients;
- six statistic cards immediately under the hero;
- decorative doughnut charts with no analytic purpose;
- excessive icon circles;
- “AI insight” boxes everywhere;
- testimonials in the primary research experience;
- fake social proof;
- unexplained proprietary scores;
- celebratory confetti / gamification around investment returns;
- giant comparison matrices for first-time visitors;
- long introductory paragraphs before users can act.

---

## 17. Density limits

These are hard V6 constraints.

### Homepage
- one headline;
- one supporting paragraph;
- one primary search;
- three primary paths;
- one fund-logo section;
- one tiny concept explainer;
- one featured tool.

### Fund page above fold
- logo;
- name;
- one short description;
- max 4 facts.

### Option page above fold
- logo + option name;
- one descriptor;
- max 4 primary metrics;
- max 2-sentence takeaway.

### Comparison quick view
- max 4 takeaways;
- max 4 primary visual comparison blocks before advanced detail.

### Copy
- ordinary consumer paragraph target: 25–45 words;
- avoid consecutive paragraphs where a visual or label can communicate the same concept.

---

## 18. The two-interface principle

Super Evidence should feel like **one coherent brand with two depths**, not two separate products.

### Consumer depth

`Understand → Explore → Compare → Calculate`

Characteristics:
- friendly;
- visual;
- minimal terminology;
- 3–4 metrics at a time;
- contextual learning;
- no ranking obsession.

### Research depth

`Screen → Analyse → Validate → Source`

Characteristics:
- configurable filters;
- data tables;
- historical charts;
- APRA standardisation;
- methodology;
- source/evidence ledger;
- comparability and discrepancy states.

Research depth is reached intentionally through links such as `Detailed research` rather than being shown by default.

---

## 19. V6 implementation recommendation

The current static HTML/CSS/JS prototype proved the product architecture, but V6 should begin moving toward a production component system.

Recommended target stack:

- **Next.js / React** for reusable fund, option, comparison and research views;
- **shadcn/ui** for accessible interaction primitives, fully re-skinned;
- **Recharts** for accessible responsive charts;
- **Supabase** as the evidence/data layer;
- existing GitHub repository as source control;
- Vercel for production preview/deployment when the V6 branch is ready.

Do not migrate the live experience recklessly. Build V6 alongside the current site, validate the core screens visually and functionally, then switch over.

---

## 20. V6 visual acceptance test

Before a page is accepted, ask all of the following:

### Complete beginner
- Can I tell what this page is for in 5 seconds?
- Do I understand the first action without knowing super terminology?
- Is there a plain-English explanation before specialist data?
- Can I identify the 1–3 things that matter most?
- Do charts explain rather than decorate?

### Confident consumer
- Can I find the relevant options quickly?
- Can I compare on a like-for-like basis?
- Can I see long-term return, risk, cost and allocation without digging excessively?
- Can I change balance/assumptions easily?

### Adviser/researcher
- Can I reach the exact original data, source and reporting date?
- Can I inspect historical strategy and methodology?
- Can I distinguish issuer facts from Super Evidence calculations?
- Can I export or interrogate sufficient detail without the consumer interface becoming cluttered?

### Visual quality
- Does it look specifically designed for Super Evidence?
- Could the page plausibly belong to a premium Australian financial institution?
- Does it avoid generic SaaS/AI visual tropes?
- Are real fund identities prominent where relevant?
- Is there enough negative space?
- Is every card, colour, icon and chart earning its place?

If any answer is no, the page is not V6-ready.

---

## 21. Research sources

Primary/reference pages used in this review:

- MoneySmart — Choosing a super fund: https://moneysmart.gov.au/how-super-works/choosing-a-super-fund
- MoneySmart — Switching super funds: https://moneysmart.gov.au/grow-your-super/switching-super-funds
- MoneySmart — Types of super funds: https://moneysmart.gov.au/how-super-works/types-of-super-funds
- MoneySmart — Super investment options: https://moneysmart.gov.au/grow-your-super/super-investment-options
- Wealthsimple Invest: https://www.wealthsimple.com/en-ca/invest
- Wealthsimple Classic Portfolio: https://www.wealthsimple.com/en-ca/invest/classic-portfolios
- Wealthsimple Automated Investing: https://www.wealthsimple.com/en-ca/automated-investing
- Betterment: https://www.betterment.com/
- Moneybox: https://www.moneyboxapp.com/
- Monzo Investments: https://monzo.com/investments
- PensionBee: https://www.pensionbee.com/
- Airbnb Australia: https://www.airbnb.com.au/
- Macquarie Australia: https://www.macquarie.com.au/
- Morningstar Australia Investment Ideas: https://www.morningstar.com.au/investments/ideas
- Portfolio Charts methodology: https://portfoliocharts.com/user-guide/methodology/
- Finder super comparison: https://www.finder.com.au/super-funds
- Canstar super comparison: https://www.canstar.com.au/superannuation
- Nielsen Norman Group — Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Nielsen Norman Group — Dashboard charts: https://www.nngroup.com/articles/dashboards-preattentive/
- GOV.UK Design System — Details: https://design-system.service.gov.uk/components/details/
- GOV.UK Design System — Tabs: https://design-system.service.gov.uk/components/tabs/

---

## Final design thesis

> **Super Evidence should feel simple because the system underneath it is sophisticated — not simple because information has been removed.**

The consumer should experience calm, confidence and visual clarity. The professional should be able to keep drilling until they reach the exact evidence, methodology and economic reasoning behind every number.

That combination — **Wealthsimple-level visual communication, Macquarie-level trust, Airbnb-level navigation, MoneySmart neutrality, and Portfolio Charts/Morningstar depth** — is the design target for V6.
