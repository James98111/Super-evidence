# Super Evidence V8 — design QA

Date: 7 September 2026  
Scope: redesigned V8 discovery homepage and its routes into the existing research experience

## Result

**Passed**

The homepage was checked in the running application at 1363 × 936. The generated lifestyle images contain no embedded text. Navigation, the delegated hero carousel, fund-first entry, question shortcuts, evidence cues and existing fund explorer all work in the browser.

## Product checks

- Beginner: a plain-English question, large visual entry points and a three-step path appear before dense data.
- Confident consumer: fees, performance, risk, holdings, time horizon and comparison routes are directly available.
- Adviser / researcher: APRA entity counts, option/pathway breadth, methodology links and source/methodology distinctions remain visible.
- Fund-first discovery is preserved; the homepage does not expose a giant option list.
- No “best fund” claim, ranking or personalised recommendation was introduced.
- Regulatory data, issuer verification and derived calculations remain described as distinct evidence layers.

## Visual and interaction checks

- Warm ivory, navy, terracotta and sage palette; no glassmorphism or 3D illustration.
- Editorial headline typography and restrained sans-serif interface type.
- Three Australian lifestyle photographs with clear text-safe composition and no AI-generated copy inside the images.
- Carousel supports previous/next, direct slide selection, pause/play and automatic rotation.
- Automatic movement is disabled when reduced-motion is preferred.
- All icon-led controls retain accessible names; decorative icons are hidden from assistive technology.
- Buttons route into working V8 fund, compare, calculator, learn and research views.
- Mobile CSS collapses the hero, journey, question ribbon and proof statistics into readable single/dual-column layouts.

## Engineering checks

- `node --check v8/app.js` — passed
- `node tests/core-v8.test.mjs` — passed
- `git diff --check` — passed
- Browser console — no application errors; only the environment's browser-extension metadata warning was observed

## Severity review

- P0 blockers: none
- P1 major issues: none
- P2 minor issues: none open

