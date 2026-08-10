# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable design decisions

- The selected visual direction is the third generated concept, “Spatial Intelligence Atlas”.
- The homepage must work both as a comprehensive AMAP CV Lab introduction and as a dedicated ABot Stack hub.
- Preserve the end-to-end narrative: spatial/data foundations -> world and foundation models -> agents and real execution.
- Keep the system lightweight, premium, light-blue-led, bilingual, and driven by one JSON file per content module.
- Keep the ABot Stack title and its layer cards on one visible left edge; avoid decorative indentation that breaks the atlas grid.
- Balance the hero columns with useful evidence and a compact vertical rhythm; do not leave a long empty rail below the introductory copy.
- Show the complete lab-news archive from `news.json`, while using hierarchy and density to keep the page scannable. Never hard-code archive counts in JSX or descriptive copy.
- Treat English and Chinese as separate typographic cases: Chinese headings need calmer sizing, looser line-height, and less aggressive tracking than English headings.
- Keep section labels readable and proportionate to their titles; avoid tiny eyebrow copy paired with oversized display text or excessive section/footer whitespace.
- The homepage hero must represent AMAP CV Lab as a whole; ABot-World-specific performance figures belong to the ABot-World project context, not the lab-wide first screen.
- On desktop, the hero should occupy the full first viewport below the header so the next section does not peek into view.
- Make the first screen the visual high point: use the Earth-to-action atlas as the single signature moment, with purposeful spatial depth and motion rather than scattered decoration.
- Hero display lines must always wrap within the left grid track at every desktop width and zoom level; never use `white-space: nowrap` on bilingual display copy, and keep grid/flex children shrinkable with `min-width: 0`.
- In every ABot layer, present project media as three independent reusable cards with a standard image ratio (prefer 16:10 or 4:3 and never wider than 2:1). The layer may be a horizontal band, but project imagery must never become a full-width banner or rely on extreme panoramic cropping; preserve the same card ratio in tablet grids and mobile horizontal snap layouts.
- Use one 16:10 media frame for every project and news cover across the site; text rows may grow, but their images must never stretch to match arbitrary row heights.
- Render each research area exactly once. Express areas that span multiple Understand / Simulate / Act stages through layout spans and a three-cell stage rail, never by duplicating the same topic card.
- Keep every news entry reachable without duplication: the first three form the visual highlights and every remaining entry forms the timeline archive.
- Reduced-motion mode must expose the complete first-screen content in its final state; disabling animation must never leave the hero, worldline, CTA, or signal reel transparent or transformed off-screen.
- The hero's only ongoing motion is the six-item Latest Signal Reel sourced from `news.json`; it advances discretely on eligible tall desktops, never as a marquee, and never autoplays on mobile or in reduced-motion mode.
- Keep the Latest Signal Reel visible on short desktops as the 142px Compact Atlas Reel; short viewports below 840px may disable autoplay and compress descriptions, but must not hide the reel, H1, CTA, or stage titles.
- Scale the reel deliberately for high screens instead of distributing leftover height with `space-between`: approximately 300px at 900px tall, 374px at 1200px, and 468px at 1500px. Preserve 16:10 media and fixed, bounded gaps between intro, reel, and worldline.
- Reel dragging must retain pointer capture until pointer up or cancel. Hover, focus, document visibility, and live reduced-motion changes must pause and cancel active motion; only eligible tall desktops show the explicit Pause / Play control.
- Keep the worldline index in normal document flow as its own row. It must never use absolute positioning or a gradient overlay that can cover the Act description.
- Keep buttons, filter options, CTA labels, carousel hints, and other interactive copy independent from collection counts. Counts may appear in data-driven statistics and result summaries, but never hard-code values such as `All 48`, `View all 48 works`, or `Six latest updates` into control labels.
- Treat `projects.json` and `publications.json` as the two canonical work-entity sources. Join them only through explicit `canonicalWorkId` / `projectIds`; never concatenate them into duplicate rows or infer identity from titles.
- Keep the complete work index as a real GitHub Pages multi-page entry at `/works/` (`works/index.html`), not a client-only route that depends on a server rewrite. The homepage loader must not fetch `publications.json` or `works.json`.
- Keep `works.json` limited to Works-page copy, filters, empty states, and statistics labels; it must not duplicate project or publication entities.
- The homepage Selected Work module contains exactly six `featuredOnHome` projects ordered by `homeRank`, with one primary research area represented by each: FutureSightDrive, FantasyTalking, FantasyVLN, FantasyWorld, CLoD-GS, and ABot-OCR.
- Works filters describe overlapping capabilities (`With project page`, `With publication`): a hybrid work can match both while rendering only once. Group each canonical work once by `primaryResearchAreaId`, and show other research areas only as secondary tags.
- Missing Works media uses the fixed 16:10 venue/year typographic tile. Do not invent imagery, reuse unrelated logos, or stretch media to the row height.
