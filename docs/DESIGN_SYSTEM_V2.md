# Super Evidence — Design System V2

## Purpose

Super Evidence is an independent public resource for understanding the Australian superannuation market. The product must make a very large, technical dataset feel calm, trustworthy and understandable to people who may know very little about super.

The experience should feel closer to a premium Australian financial-services publication than a fintech dashboard. The system should be capable of supporting every Australian super fund, every investment option, detailed historical data, calculators and advanced analysis without showing all of that complexity at once.

## Core design idea

**Deep underneath. Calm on the surface.**

The product should always prefer clarity over density. A user should be able to understand what the site offers within five seconds of landing on the homepage.

Primary promise:

> Understand your super with confidence.

Supporting proposition:

> Independent, easy-to-understand information about Australia's super funds and investment options.

Trust proposition:

> Every number has a source.

## Brand posture

- Independent, not sales-led.
- Australian, but not stereotypically Australian.
- Warm, not corporate-cold.
- Intelligent, not academic.
- Financial-services credible, not startup-like.
- Helpful to beginners without speaking down to them.
- Serious enough for sophisticated users and researchers.

The current name **Super Evidence** is provisional. The design must remain easy to rebrand. Brand text, mark, colour tokens and imagery must not be hard-coded into structural components.

## Visual references

The intended blend is:

- **CommBank / premium financial services:** trust, hierarchy, polish.
- **MoneySmart:** plain-English accessibility and neutrality.
- **Airbnb:** effortless navigation and obvious next action.
- **Bloomberg:** depth and seriousness underneath the surface.

Avoid copying any of them visually. The result must feel bespoke to Super Evidence.

## Anti-patterns

Do not use:

- card soup;
- large grids of colourful tiles on the homepage;
- gradients for decoration;
- excessive rounded corners;
- floating glass panels;
- generic AI-generated illustrations;
- handwritten slogans placed over photography;
- decorative arrows everywhere;
- multiple competing CTAs above the fold;
- rankings as the dominant homepage concept;
- unexplained finance jargon;
- giant hero copy that pushes the actual task off-screen;
- badges for every metric;
- unnecessary icons;
- fake precision or invented numbers.

## Typography

### Primary heading family

**Source Serif 4**

Use for:

- H1;
- H2;
- major editorial statements;
- fund and option names where appropriate.

Reason: it feels established, editorial and financial-services credible without looking like a default AI/product font.

### Interface/body family

**Source Sans 3**

Use for:

- navigation;
- body copy;
- labels;
- tables;
- filters;
- forms;
- data annotations.

### Numerals

Use tabular numerals for data tables and comparison metrics.

### Scale

Desktop:

- H1: 60–72px, weight 500, line-height 0.98–1.04.
- H2: 38–48px, weight 500.
- H3: 23–28px, weight 500.
- Lead: 20–22px.
- Body: 16–17px.
- Supporting: 14px.
- Data label: 12–13px.

Mobile:

- H1: 42–48px.
- H2: 32–36px.
- Body: 16px minimum.

Avoid ultra-tight tracking. Serif headings should feel natural, not compressed.

## Colour system

### Core

- `navy-900`: `#102A43` — primary brand text, headings, key actions.
- `navy-700`: `#274C67` — secondary financial-service blue.
- `terracotta-600`: `#B85C43` — restrained warm accent and primary CTA.
- `terracotta-100`: `#F5E7E1` — subtle warm highlights.
- `sage-600`: `#5E7968` — positive/verified contextual accent only.
- `sage-100`: `#EDF2EE`.

### Surfaces

- `ivory-50`: `#FBF8F4` — main warm page background.
- `paper`: `#FFFFFF` — data and form surfaces.
- `stone-100`: `#F3F1ED` — subtle section differentiation.
- `stone-300`: `#DDD8D1` — rules and dividers.
- `ink-muted`: `#5F6D78`.

Colour is functional. Most of the site should be ivory, white and navy. Terracotta appears sparingly. Green should never become a generic 'good performance' colour.

## Spacing

Whitespace is a core design element.

Desktop page max width: **1280px**.

Content reading width: **680–760px**.

Outer horizontal padding:

- desktop: 48–64px;
- tablet: 32px;
- mobile: 20px.

Vertical rhythm:

- hero top/bottom: 88–120px;
- major section spacing: 88–112px;
- section title to content: 32–40px;
- row spacing: 20–28px.

The interface should feel intentionally under-filled. Never add content simply to occupy empty space.

## Corners and shadows

- Search input radius: 8px.
- Buttons: 6–8px.
- Data surfaces: 4–8px.
- Avoid pill buttons except for tiny filter controls where semantically useful.
- Default shadow: none.
- Only search overlays/modals may use a soft shadow.

## Photography

Use photography rarely.

Homepage may use **one** lifestyle photograph.

Rules:

- real photography rather than AI illustration;
- natural Australian or broadly Australian-feeling setting;
- warm daylight;
- calm, aspirational but ordinary;
- no fake finance graphs, money overlays, slogans or text written into the photograph;
- avoid overly staged corporate stock photography.

Interior pages should generally rely on typography, data and fund branding rather than lifestyle photography.

## Iconography

Use a small bespoke line-icon set only where it improves navigation.

Initial icons:

- find/search;
- compare;
- learn;
- calculator;
- evidence/source;
- fees;
- risk;
- allocation.

Style:

- 1.75px–2px stroke;
- rounded line caps;
- simple geometric construction;
- no filled cartoon illustrations;
- single colour at a time.

## Fund logos

Official publicly available fund logos are important because Super Evidence is a market-wide platform rather than a single-fund product.

Use official fund logos in:

- homepage market strip;
- fund directory;
- fund search results;
- fund profile headers;
- comparisons.

Rules:

- preserve original proportions and colours;
- never recolour a fund logo to fit the site palette;
- use a neutral visual container only when necessary;
- apply consistent optical height, not identical width;
- use fund names as accessible fallback text;
- do not imply endorsement or partnership.

## Homepage information architecture

The homepage should answer three questions in order:

1. **What is this?**
2. **What can I do here?**
3. **Which part should I enter?**

### Header

Left: brand.

Primary navigation:

- Find a fund
- Compare
- Calculators
- Learn
- About

Right: search icon.

No login requirement. No rankings or advanced analysis in primary navigation.

### Hero

Headline:

> Understand your super with confidence.

Supporting copy:

> Independent, easy-to-understand information about Australia's super funds and investment options.

Dominant search:

> Search a super fund, investment option or topic

Hero image: one real lifestyle photo.

### Three entry points

After the hero:

**Find a fund**
Browse Australia's super funds and all their investment options.

**Compare options**
Understand differences in fees, risk, investment mix and long-term performance.

**Learn about super**
Plain-English guides from the basics through to more advanced concepts.

No fourth tile.

### Fund market shelf

Large whitespace before heading:

> Explore Australia's super funds

Display a calm row/grid of official logos. Include a restrained `View all funds` link.

This section communicates market coverage. It is not a ranking.

### Calculators

Introduce calculators as an optional deeper tool:

> See what your super could be.

Feature one primary calculator and one secondary calculator. Do not show all calculators at once.

### Footer

Simple.

- About
- Methodology
- Privacy
- Disclaimers
- Contact

Include clear factual-information disclaimer.

## Fund directory

Default view should favour browsing and search, not a giant spreadsheet.

Each fund listing includes:

- official logo;
- fund name;
- product count / option count;
- short neutral description if sourced;
- `Explore fund` action.

Filters only appear after the user requests them.

## Fund page

Top:

- logo;
- fund name;
- short factual description;
- product hierarchy.

Navigation:

- Overview
- Investment options
- Fees
- Performance
- Fund information

Investment options should initially display a calm list/table with only:

- option name;
- type;
- growth exposure;
- risk;
- 10-year return where available;
- investment cost.

Detailed evidence remains one level deeper.

## Investment option page

Above the fold should show only the highest-value information:

- option name;
- fund;
- one-sentence explanation;
- 10-year return;
- cost at a representative/user balance;
- growth exposure;
- risk;
- suggested timeframe.

Then expandable sections:

- Performance
- What it owns
- Fees
- Risk
- History
- Economic analysis
- Evidence

Every technical concept receives a short plain-English explanation.

## Comparison

Comparison is factual, not prescriptive.

Default visible dimensions:

- long-run return;
- growth exposure;
- risk;
- suggested timeframe;
- cost at selected balance.

Then expandable:

- portfolio;
- fees;
- historical changes;
- economic analysis;
- evidence.

The site must warn when options are not genuinely comparable.

## Rankings and screening

Rankings exist one or more levels below Compare/Explore.

Do not place `Rankings` in primary navigation.

The platform should prefer the language:

- screen;
- sort;
- compare peers;
- explore similar options.

Any ranking must disclose its peer-universe definition and methodology.

## Calculators

Calculators are first-class content, but not advice.

Initial calculator suite:

1. Super projection calculator.
2. Fee impact calculator.
3. Contribution calculator.
4. Real-return calculator.
5. Retirement income illustration.

Every calculator must show explicit assumptions.

Assumptions are editable and must include source/method notes where relevant.

Never hide assumptions behind a generic `advanced` mode.

## Beginner explanations

Use contextual explanation rather than a separate beginner/advanced switch.

Example:

> **88% growth assets**
> This portfolio is mostly invested in assets designed for long-term growth, so its value may move around more in the short term.

Then:

> Learn what growth assets are →

## Advanced analysis

Advanced economics remains available but does not dominate the consumer experience.

Topics include:

- real returns after inflation;
- active vs indexed;
- benchmark-relative performance;
- fees and compounding;
- strategic vs actual allocations;
- portfolio drift;
- fund scale and administration economics;
- unlisted-asset valuation considerations;
- historical strategy comparability.

Advanced analysis must clearly distinguish raw observations from derived calculations.

## Data status language

Preferred:

- Issuer verified
- Regulator verified
- Dual verified
- Calculated
- Methodology difference
- Not yet verified

Avoid alarming red unless there is an actual data-integrity problem.

## Accessibility

- WCAG AA contrast minimum.
- Minimum 44px touch targets where practical.
- Visible keyboard focus.
- Fund logos require alt text.
- Tables need semantic headings.
- Charts must not rely on colour alone.
- Plain-English equivalents for technical metrics.

## Responsive behaviour

Mobile is not a compressed desktop.

On mobile:

- hero becomes single column;
- search remains dominant;
- three entry points stack vertically with generous spacing;
- fund logo shelf becomes horizontally scrollable or two-column grid;
- comparison tables use metric-by-metric stacked layout;
- advanced sections stay collapsed by default.

## Design QA test

Before accepting a page, ask:

1. Can a user understand what this page is for within five seconds?
2. Is there one obvious next action?
3. Can anything be removed without reducing understanding?
4. Is jargon explained where it appears?
5. Are raw facts distinguishable from platform calculations?
6. Does the page still feel calm when the underlying dataset grows 100x?
7. Would this look credible beside a major Australian financial-services website?
8. Does it look intentionally designed rather than generated from a generic component library?

If the answer to any is no, simplify again.
