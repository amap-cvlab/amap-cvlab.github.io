# Design QA — Round 5

- implementation URL: `http://127.0.0.1:5173/works/?lang=en`
- date: 2026-08-10
- scope: real `/works/` multi-page entry, complete project/publication ledger, Works filters, responsive Works layout, mobile navigation focus, and homepage regression
- deployment: not deployed

## Visual evidence

All eight files were checked after writing; their pixel dimensions match their filenames.

- `design/round5-works-en-1440x900.png` — 1440 × 900
- `design/round5-works-zh-1440x900.png` — 1440 × 900
- `design/round5-works-en-390x844.png` — 390 × 844
- `design/round5-works-zh-390x844.png` — 390 × 844
- `design/round5-home-en-1440x900.png` — 1440 × 900
- `design/round5-home-zh-1440x900.png` — 1440 × 900
- `design/round5-home-en-390x844.png` — 390 × 844
- `design/round5-home-zh-390x844.png` — 390 × 844

## Canonical Works contracts

- 40 project entities and 47 publication/report entities merge into 48 unique canonical works.
- 39 works contain both a project and a publication; `abot-er-preview` is the sole project-only work.
- The eight publication-only works are `asyncshield`, `dpose`, `g3pt`, `navforesee`, `scmt`, `seeing-space-motion`, `seq-grow-graph`, and `synthetic-speech`.
- Every project uses `canonicalWorkId === id`; project and publication canonical IDs are independently unique.
- The validator protects the exact frozen 40-project, 47-publication, and 48-work ledgers, not only their counts.
- The historical 29-item technology archive remains complete with official-area counts 7 / 6 / 5 / 2 / 5 / 4. All seven Fantasy-AMAP research projects remain present.
- `news.json` contains 32 unique lab updates; the homepage renders three highlights plus the remaining archive without duplicating an event.

## Works layout measurements

| Viewport | Hero | H1 | Sticky toolbar | Work media | First rows | Horizontal overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 × 900 EN | 269 px | 64 px | 97 px | 168 × 105 (16:10) | 163.5 px / 147 px; two complete rows visible | 0 |
| 1440 × 900 ZH | 269 px | 57.6 px | 97 px | 168 × 105 (16:10) | two complete rows visible | 0 |
| 390 × 844 EN | 64–301 px (237 px) | 41.7 px; x=20 | 65 px | 104 × 65 (16:10) | first long hybrid row ends at 773.1 px | 0 |
| 390 × 844 ZH | 64–301 px (237 px) | 39.8 px; x=20 | 65 px | 104 × 65 (16:10) | first row ends at 786.3 px | 0 |

At 390 px, the filter toggle is 50 px wide, leaving 292 px for search. Collection totals remain data-driven statistics and result summaries; filter buttons, CTAs, and reel hints intentionally contain no fixed counts. Fresh EN and ZH measurements both place the eyebrow and H1 at x=20.

Mobile main work titles no longer use a line clamp. A live 390 px audit found 48 rendered main titles, zero clipped elements, and an empty computed line-clamp value. Long paper-only titles such as NavForesee and G3PT grow the row and remain complete; summaries yield before titles. Desktop retains its bounded editorial title treatment.

## Filter and merge behavior

The browser returned these unique result counts without duplicate hybrid rows:

| State | Results |
| --- | ---: |
| All | 48 |
| With project page | 40 |
| With publication | 47 |
| Map & Autonomous Driving | 8 |
| Year 2022 | 2 |
| Search `FantasyWorld` | 1 |
| `?series=abot` deep link | 13 |
| Reset | 48 |

Works are grouped once by `primaryResearchAreaId`; secondary areas remain tags and still participate in filtering. Search covers the short project title, publication title, summary, venue, and series.

## Mobile navigation behavior

- Opening the menu moves focus to the first navigation item (`Lab`).
- Pressing Escape closes the menu and returns focus to the true menu toggle.
- After the close transition, the navigation computes to `visibility:hidden` and `pointer-events:none`, so its links are not in the closed focus flow.
- The same behavior applies to the homepage and Works entry through the shared `Header` component.

## Release-fact corrections

- ABot-M0 is `open-source`; project, repository, paper, inference code, training code, model weights, and data are marked released and linked to the official project, branch, ModelScope weights, and ModelScope metadata.
- AstraNav-World is `partial-release`; only Action-Former inference and its checkpoint are released, while training code and diffusion-policy resources remain preparing.
- Sat3DGen includes official project, repository, paper, code, weights, dataset, and Hugging Face Space demo availability.
- ABot-N0 links directly to the `ABot-N0` repository branch.
- ABot-Claw and ABot-ER use year precision (`2026`) because no official exact month was established. The formatter and validator both support year precision.

## Homepage regression

- At 1440 × 900 the homepage hero ends at 901 px and the ABot section begins at the same boundary; no next-section content leaks into the first viewport.
- At 390 × 844 the EN hero ends at 1221.7 px and the ZH hero at 1113.3 px; the ABot section starts at the exact corresponding boundary.
- No horizontal overflow was measured at either 1440 or 390.
- Selected Work contains exactly six ranked projects, one per primary research area: FutureSightDrive, FantasyTalking, FantasyVLN, FantasyWorld, CLoD-GS, and ABot-OCR.
- The Round 4 Atlas Worldline, Latest-from-the-lab reel, ABot bands, Research topology, and complete News hierarchy were not structurally changed in this round.

## Automated verification

- `npm run check:content` — passed; 8 files and 151 stable IDs checked.
- `npm run test:ui` — passed; 19/19 deterministic UI and data contracts.
- `npm run build` — passed; 4,592 modules transformed; both `dist/client/index.html` and `dist/client/works/index.html` emitted.
- `npm run test:sites` — passed; 5/5 static-worker and packaging tests, including direct `/works/` routing.

## Status

Round 5 passes the canonical-data, multi-page routing, bilingual layout, responsive media, filter, focus, homepage-regression, and packaging contracts. The implementation remains local and has not been deployed.
