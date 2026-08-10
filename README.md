# AMAP CV Lab Homepage and Works Index

A bilingual, data-driven homepage for Alibaba AMAP CV Lab and the ABot Stack, plus a complete Projects & Publications index. The lightweight React/Vite site uses an “Atlas Worldline” to connect the lab-wide Understand → Simulate → Act narrative with a dedicated ABot Stack observatory.

The build has two real static entries for GitHub Pages:

- `/` — the editorial homepage, including six selected works and the complete lab-news archive.
- `/works/` — the complete, filterable Works index. It contains 48 canonical works formed from 40 project records and 47 publication/report records.

## Content model

All public copy and release metadata live in independent JSON modules under `public/data/`:

| Module | Purpose |
| --- | --- |
| `site.json` | Brand, navigation, hero worldline, global UI labels, footer |
| `about.json` | Lab introduction, three capability pillars, and closing section |
| `research-areas.json` | Six official research areas, their presentation stages, and reverse project coverage |
| `abot-stack.json` | Three-layer ABot Stack and its nine visible nodes |
| `projects.json` | 40 project entities, homepage selection metadata, links, media, areas, and release state |
| `publications.json` | 47 publication/report entities and explicit `projectIds` relationships |
| `works.json` | Works-page copy, filter labels, statistics labels, help text, and empty states only |
| `news.json` | Chronological releases, news, product milestones, and evidence |

Visible bilingual fields use `{ "en": "…", "zh": "…" }`. Project and publication records remain separate sources of truth and are merged at runtime only through explicit `canonicalWorkId` / `projectIds` relationships. A project with a related publication renders as one hybrid work, so the index contains 48 unique works rather than 87 duplicated rows.

The homepage loads only its six original modules. The Works entry uses `loadWorksContent` to load `projects.json`, `publications.json`, `research-areas.json`, `site.json`, and `works.json`; changing the publications archive therefore does not increase the homepage data payload.

The content validator prevents missing required fields, invalid URLs, broken assets, duplicate or dangling references, unsupported release states, navigation mismatches, venue/year drift, invalid home selection, and canonical-work count regressions. It also protects the historical 29-work catalog, the six official research-area counts, the seven Fantasy-AMAP research projects, and the explicit 40 / 47 / 48 entity relationship.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run check:content
npm run test:ui
npm run build
npm run test:sites
```

`npm run build` writes both `dist/client/index.html` and `dist/client/works/index.html` for GitHub Pages, then prepares the same output for Sites. The Sites worker also resolves `/works` and `/works/` directly to the nested entry; neither deployment path relies on a single-page-app rewrite.

## Publishing

`.github/workflows/deploy-pages.yml` builds and deploys the root site whenever `main` is pushed. In GitHub repository settings, choose **GitHub Actions** as the Pages source.

## Editorial rules

- Edit entity content directly in the JSON module that owns it. Do not add a generated aggregate Works catalog or hard-code work records in JSX.
- Keep release claims artifact-specific: paper, project page, code, weights, data, benchmark, or demo.
- Do not label previews as open-source releases.
- Prefer official GitHub repositories, project pages, arXiv records, model/data hubs, and Alibaba Group news as evidence.
- Keep media local; do not hotlink production images.
- Update `public/assets/ATTRIBUTION.md` when adding or replacing an asset.
